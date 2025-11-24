
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { StockItem, Transaction, User, PendingRequest, TransactionType } from './types';
import { Dashboard } from './components/Dashboard';
import { ReportView } from './components/ReportView';
import { Modal } from './components/ui/Modal';
import { GoodsInForm } from './components/GoodsInForm';
import { GoodsOutForm } from './components/GoodsOutForm';
import { PalletShiftForm } from './components/PalletShiftForm';
import { Login } from './components/Login';
import { ExpiryReportView } from './components/ExpiryReportView';
import { LocationView } from './components/LocationView';
import { Sidebar } from './components/Sidebar';
import { MenuIcon, LogoutIcon } from './components/ui/Icons';
import { ItemCodeManager } from './components/ItemCodeManager';
import { PendingRequests } from './components/PendingRequests';
import { logTransactionToSheet } from './utils/googleSheetLogger';
import { supabase } from './utils/supabaseClient';
import { INITIAL_ITEM_CODES, INITIAL_USERS } from './utils/initialData';

type View = 'DASHBOARD' | 'REPORTS' | 'EXPIRY_REPORT' | 'LOCATIONS' | 'SETTINGS' | 'PENDING_REQUESTS';
type ModalType = 'GOODS_IN' | 'GOODS_OUT' | 'PALLET_SHIFT' | null;

const App: React.FC = () => {
    // Data state - fetched from Supabase
    const [stock, setStock] = useState<StockItem[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [itemCodes, setItemCodes] = useState<string[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    
    // User session remains in local storage for persistence across reloads on this device
    const [currentUser, setCurrentUser] = useLocalStorage<string | null>('coldStorageUser', null);
    
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Determine user role. 
    // 1. Try to find user in DB users list.
    // 2. If not found, but user is 'admin', assume ADMIN (fallback for initial setup).
    // 3. Default to USER if nothing matches (safety).
    const dbUser = users.find(u => u.username.toLowerCase() === currentUser?.toLowerCase());
    const currentUserRole = dbUser ? dbUser.role : (currentUser === 'admin' ? 'ADMIN' : 'USER');

    // Fetch data from Supabase on mount and Subscribe to Realtime Changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: stockData } = await supabase.from('stock').select('*');
                if (stockData) setStock(stockData);

                const { data: txData } = await supabase.from('transactions').select('*');
                if (txData) setTransactions(txData);
                
                // Fetch pending requests
                const { data: pendingData } = await supabase.from('pending_requests').select('*');
                if (pendingData) setPendingRequests(pendingData);

                // Fetch Item Codes and Seed if empty
                const { data: itemCodesData } = await supabase.from('item_codes').select('*');
                if (itemCodesData && itemCodesData.length > 0) {
                    setItemCodes(itemCodesData.map((i: any) => i.code).sort());
                } else {
                    // Seed defaults if empty
                    console.log("Seeding default item codes...");
                    const codesPayload = INITIAL_ITEM_CODES.map(code => ({ code }));
                    // Insert in chunks to avoid payload limits if necessary, but 200 is usually fine
                    const { error: seedError } = await supabase.from('item_codes').insert(codesPayload);
                    if (!seedError) {
                        setItemCodes(INITIAL_ITEM_CODES.sort());
                    } else {
                        console.error("Error seeding item codes:", seedError);
                    }
                }

                // Fetch Users and Seed if empty
                const { data: usersData } = await supabase.from('users').select('*');
                if (usersData && usersData.length > 0) {
                    setUsers(usersData);
                } else {
                     // Seed defaults if empty
                     console.log("Seeding default users...");
                     const { error: userSeedError } = await supabase.from('users').insert(INITIAL_USERS);
                     if (!userSeedError) {
                         setUsers(INITIAL_USERS);
                     } else {
                         console.error("Error seeding users:", userSeedError);
                     }
                }

            } catch (error) {
                console.error('Error fetching data from Supabase:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Realtime Subscription setup
        const channel = supabase.channel('db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'stock' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newItem = payload.new as StockItem;
                    setStock(prev => {
                        // Prevent duplicates if added locally via optimistic update
                        if (prev.some(item => item.id === newItem.id)) return prev;
                        return [...prev, newItem];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    const updatedItem = payload.new as StockItem;
                    setStock(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
                } else if (payload.eventType === 'DELETE') {
                    const deletedItem = payload.old as { id: string };
                    setStock(prev => prev.filter(item => item.id !== deletedItem.id));
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
                const newTx = payload.new as Transaction;
                setTransactions(prev => {
                    if (prev.some(tx => tx.id === newTx.id)) return prev;
                    return [...prev, newTx];
                });
            })
             .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_requests' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newReq = payload.new as PendingRequest;
                    setPendingRequests(prev => [...prev, newReq]);
                } else if (payload.eventType === 'DELETE') {
                    const deletedReq = payload.old as { id: string };
                    setPendingRequests(prev => prev.filter(r => r.id !== deletedReq.id));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'item_codes' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                     const newCode = (payload.new as { code: string }).code;
                     setItemCodes(prev => {
                         if (prev.includes(newCode)) return prev;
                         return [...prev, newCode].sort();
                     });
                } else if (payload.eventType === 'DELETE') {
                     const deletedCode = (payload.old as { code: string }).code;
                     setItemCodes(prev => prev.filter(c => c !== deletedCode));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
                 if (payload.eventType === 'INSERT') {
                    const newUser = payload.new as User;
                    setUsers(prev => {
                        if (prev.some(u => u.username === newUser.username)) return prev;
                        return [...prev, newUser];
                    });
                 } else if (payload.eventType === 'DELETE') {
                    const deletedUser = payload.old as { username: string };
                    setUsers(prev => prev.filter(u => u.username !== deletedUser.username));
                 } else if (payload.eventType === 'UPDATE') {
                    const updatedUser = payload.new as User;
                     setUsers(prev => prev.map(u => u.username === updatedUser.username ? updatedUser : u));
                 }
             })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleLogin = (username: string, password: string) => {
        const lowerUsername = username.toLowerCase().trim();

        // 1. Check against Database Users first
        const user = users.find(u => u.username.toLowerCase() === lowerUsername);
        
        if (user) {
            if (user.password === password) {
                setCurrentUser(user.username);
                setLoginError('');
            } else {
                setLoginError('Invalid username or password.');
            }
            return;
        }

        // 2. Fallback for default 'admin' if NOT found in database (and not yet seeded or fetch failed)
        if (lowerUsername === 'admin' && password === 'admin123') {
             setCurrentUser('admin');
             setLoginError('');
             return;
        }

        setLoginError('Invalid username or password.');
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const handleAddStock = async (newStocks: StockItem[], newTransactions: Transaction[]) => {
        // APPROVAL FLOW: If User, send to pending_requests
        if (currentUserRole === 'USER') {
            const request: PendingRequest = {
                id: `REQ-IN-${Date.now()}`,
                type: 'IN',
                data: newStocks,
                requester: currentUser || 'unknown',
                timestamp: new Date().toISOString(),
                status: 'PENDING'
            };
            const { error } = await supabase.from('pending_requests').insert(request);
            if (error) {
                console.error("Error creating request", error);
                alert("Failed to submit request.");
            } else {
                alert("Goods In request submitted for Admin approval.");
                // Optimistic local update
                setPendingRequests(prev => [...prev, request]);
            }
            return;
        }

        // ADMIN FLOW: Immediate update
        const { error: stockError } = await supabase.from('stock').insert(newStocks);
        if (stockError) {
            console.error('Error adding stock:', stockError);
            alert('Failed to save stock to database.');
            return;
        }

        const { error: txError } = await supabase.from('transactions').insert(newTransactions);
        if (txError) console.error('Error saving transactions:', txError);

        setStock(prev => [...prev, ...newStocks]);
        setTransactions(prev => [...prev, ...newTransactions]);
        newTransactions.forEach(logTransactionToSheet);
    };

    const handleRemoveStock = async (
        removalList: { stockId: string; pcs: number; kgs: number }[],
        newTransactions: Transaction[]
    ) => {
        // APPROVAL FLOW: If User, send to pending_requests
        if (currentUserRole === 'USER') {
            const request: PendingRequest = {
                id: `REQ-OUT-${Date.now()}`,
                type: 'OUT',
                data: removalList,
                requester: currentUser || 'unknown',
                timestamp: new Date().toISOString(),
                status: 'PENDING'
            };
             const { error } = await supabase.from('pending_requests').insert(request);
            if (error) {
                console.error("Error creating request", error);
                alert("Failed to submit request.");
            } else {
                alert("Goods Out request submitted for Admin approval.");
                setPendingRequests(prev => [...prev, request]);
            }
            return;
        }

        // ADMIN FLOW: Immediate update
        // Update Database
        for (const detail of removalList) {
            const item = stock.find(s => s.id === detail.stockId);
            if (item) {
                const remainingPcs = item.pcs - detail.pcs;
                const remainingKgs = item.kgs - detail.kgs;
                
                // Use a small epsilon for floating point comparison safety
                if (remainingPcs > 0.0001 && remainingKgs > 0.0001) {
                    await supabase.from('stock').update({ pcs: remainingPcs, kgs: remainingKgs }).eq('id', item.id);
                } else {
                    await supabase.from('stock').delete().eq('id', item.id);
                }
            }
        }
        await supabase.from('transactions').insert(newTransactions);

        // Optimistic Local Update
        setStock(prevStock => {
            const stockAfterRemovals = prevStock.reduce((acc, item) => {
                const removalDetail = removalList.find(d => d.stockId === item.id);
                if (removalDetail) {
                    const remainingPcs = item.pcs - removalDetail.pcs;
                    const remainingKgs = item.kgs - removalDetail.kgs;

                    if (remainingPcs > 0.0001 && remainingKgs > 0.0001) {
                        acc.push({ ...item, pcs: remainingPcs, kgs: remainingKgs });
                    }
                } else {
                    acc.push(item);
                }
                return acc;
            }, [] as StockItem[]);
            return stockAfterRemovals;
        });

        setTransactions(prev => [...prev, ...newTransactions]);
        newTransactions.forEach(logTransactionToSheet);
    };

    const handleApproveRequest = async (request: PendingRequest, updatedData?: any) => {
        const dataToUse = updatedData || request.data;

        if (request.type === 'IN') {
             // Create Transactions based on approved data
             const newStocks = dataToUse as StockItem[];
             const newTransactions: Transaction[] = newStocks.map((item: StockItem, idx: number) => ({
                 id: `TRN-${Date.now()}-${idx}`,
                 type: TransactionType.IN,
                 item: item,
                 timestamp: new Date().toISOString(),
                 toLocation: item.location,
                 username: request.requester // Attribute transaction to original requester
             }));

             const { error: stockError } = await supabase.from('stock').insert(newStocks);
             if (stockError) {
                 alert("Failed to process approval: " + stockError.message);
                 return;
             }
             await supabase.from('transactions').insert(newTransactions);
             setStock(prev => [...prev, ...newStocks]);
             setTransactions(prev => [...prev, ...newTransactions]);
             newTransactions.forEach(logTransactionToSheet);

        } else if (request.type === 'OUT') {
            const removalList = dataToUse as { stockId: string; pcs: number; kgs: number }[];
            
            // Check stock availability again before approving
            for (const detail of removalList) {
                const currentItem = stock.find(s => s.id === detail.stockId);
                if (!currentItem || currentItem.pcs < detail.pcs || currentItem.kgs < detail.kgs) {
                    alert(`Cannot approve. Stock for ${detail.stockId} is insufficient or missing.`);
                    return;
                }
            }

            const newTransactions: Transaction[] = removalList.map((detail, idx) => {
                const stockItem = stock.find(s => s.id === detail.stockId)!;
                return {
                     id: `TRN-${Date.now()}-${idx}`,
                     type: TransactionType.OUT,
                     item: { ...stockItem, pcs: detail.pcs, kgs: detail.kgs }, // Snapshot of what left
                     timestamp: new Date().toISOString(),
                     fromLocation: stockItem.location,
                     username: request.requester
                };
            });

            // Perform updates
            for (const detail of removalList) {
                const item = stock.find(s => s.id === detail.stockId);
                if (item) {
                    const remainingPcs = item.pcs - detail.pcs;
                    const remainingKgs = item.kgs - detail.kgs;
                    if (remainingPcs > 0.0001 && remainingKgs > 0.0001) {
                         await supabase.from('stock').update({ pcs: remainingPcs, kgs: remainingKgs }).eq('id', item.id);
                    } else {
                         await supabase.from('stock').delete().eq('id', item.id);
                    }
                }
            }
            await supabase.from('transactions').insert(newTransactions);
            
             // Optimistic Local Update (Duplicate logic from handleRemoveStock, could be refactored)
            setStock(prevStock => {
                return prevStock.reduce((acc, item) => {
                    const removalDetail = removalList.find(d => d.stockId === item.id);
                    if (removalDetail) {
                        const remainingPcs = item.pcs - removalDetail.pcs;
                        const remainingKgs = item.kgs - removalDetail.kgs;
                        if (remainingPcs > 0.0001 && remainingKgs > 0.0001) {
                            acc.push({ ...item, pcs: remainingPcs, kgs: remainingKgs });
                        }
                    } else {
                        acc.push(item);
                    }
                    return acc;
                }, [] as StockItem[]);
            });
            setTransactions(prev => [...prev, ...newTransactions]);
            newTransactions.forEach(logTransactionToSheet);
        }

        // Delete request from pending table
        await supabase.from('pending_requests').delete().eq('id', request.id);
        setPendingRequests(prev => prev.filter(r => r.id !== request.id));
    };

    const handleRejectRequest = async (request: PendingRequest) => {
        if(window.confirm("Are you sure you want to reject this request?")) {
             await supabase.from('pending_requests').delete().eq('id', request.id);
             setPendingRequests(prev => prev.filter(r => r.id !== request.id));
        }
    };


    const handleMoveStock = async (
        details: { stockId: string; newLocation: string; pcs: number; kgs: number },
        transaction: Transaction
    ) => {
        const { stockId, newLocation, pcs, kgs } = details;
        const originalStockItem = stock.find(item => item.id === stockId);
        if (!originalStockItem) return;

        const isFullMove = originalStockItem.pcs === pcs && originalStockItem.kgs === kgs;

        if (isFullMove) {
            // Update DB Location
            await supabase.from('stock').update({ location: newLocation }).eq('id', stockId);

            // Optimistic Update
            setStock(prev =>
                prev.map(item => (item.id === stockId ? { ...item, location: newLocation } : item))
            );
        } else {
            const newStockItemForNewLocation: StockItem = {
                ...originalStockItem,
                id: `STK-${Date.now()}`,
                location: newLocation,
                pcs: pcs,
                kgs: kgs,
            };

            // Update old item in DB
            await supabase.from('stock').update({ 
                pcs: originalStockItem.pcs - pcs, 
                kgs: originalStockItem.kgs - kgs 
            }).eq('id', stockId);

            // Insert new item in DB
            await supabase.from('stock').insert(newStockItemForNewLocation);

            // Optimistic Update
            setStock(prev => {
                const updatedStock = prev.map(item => {
                    if (item.id === stockId) {
                        return { ...item, pcs: item.pcs - pcs, kgs: item.kgs - kgs };
                    }
                    return item;
                });
                return [...updatedStock, newStockItemForNewLocation].filter(
                    item => item.pcs > 0 || item.kgs > 0
                );
            });
        }
        
        await supabase.from('transactions').insert(transaction);
        setTransactions(prev => [...prev, transaction]);
        logTransactionToSheet(transaction);
    };

    // Item Codes Handlers
    const handleAddItemCode = async (code: string) => {
        await supabase.from('item_codes').insert({ code });
        setItemCodes(prev => {
             if (prev.includes(code)) return prev;
             return [...prev, code].sort();
        });
    };

    const handleDeleteItemCode = async (code: string) => {
        await supabase.from('item_codes').delete().eq('code', code);
        setItemCodes(prev => prev.filter(c => c !== code));
    };

    // User Management Handlers
    const handleAddUser = async (user: User) => {
        await supabase.from('users').insert(user);
        setUsers(prev => {
            if (prev.some(u => u.username === user.username)) return prev;
            return [...prev, user];
        });
    };

    const handleDeleteUser = async (username: string) => {
        await supabase.from('users').delete().eq('username', username);
        setUsers(prev => prev.filter(u => u.username !== username));
    };

    if (!currentUser) {
        return <Login onLogin={handleLogin} error={loginError} />;
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="text-xl font-semibold text-gray-600">Loading data...</div>
            </div>
        );
    }

    const itemsInSelectedLocation = stock.filter(item => item.location === selectedLocation);
    
    const viewTitles: { [key in View]: string } = {
        DASHBOARD: 'Dashboard',
        LOCATIONS: 'Warehouse Locations',
        REPORTS: 'Reports',
        EXPIRY_REPORT: 'Expiry Report',
        SETTINGS: 'Settings',
        PENDING_REQUESTS: 'Pending Requests'
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <Sidebar 
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                currentView={currentView}
                setCurrentView={setCurrentView}
                currentUser={currentUser}
                userRole={currentUserRole}
                onLogout={handleLogout}
                pendingCount={pendingRequests.length}
            />
            
            <div className="md:ml-64 flex flex-col h-screen">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-20 md:z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-gray-800 md:hidden">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-xl font-semibold text-gray-800">{viewTitles[currentView]}</h2>
                    
                    {/* Explicit Logout for Mobile */}
                    <button onClick={handleLogout} className="text-gray-600 hover:text-red-600 md:hidden">
                        <LogoutIcon className="w-6 h-6" />
                    </button>
                    
                    {/* Placeholder for Desktop spacing if needed, but not required if button is md:hidden */}
                    <div className="w-6 hidden md:block"></div>
                </header>
            
                <main className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {currentView === 'DASHBOARD' && (
                        <Dashboard 
                            stock={stock} 
                            onOpenGoodsIn={() => setActiveModal('GOODS_IN')}
                            onOpenGoodsOut={() => setActiveModal('GOODS_OUT')}
                            onOpenPalletShift={() => setActiveModal('PALLET_SHIFT')}
                            userRole={currentUserRole}
                        />
                    )}
                    {currentView === 'REPORTS' && <ReportView stock={stock} transactions={transactions} />}
                    {currentView === 'EXPIRY_REPORT' && <ExpiryReportView stock={stock} />}
                    {currentView === 'LOCATIONS' && <LocationView stock={stock} onLocationClick={setSelectedLocation} />}
                    {currentView === 'SETTINGS' && (
                        <ItemCodeManager 
                            itemCodes={itemCodes} 
                            onAddItemCode={handleAddItemCode}
                            onDeleteItemCode={handleDeleteItemCode}
                            users={users}
                            onAddUser={handleAddUser}
                            onDeleteUser={handleDeleteUser}
                            currentUser={currentUser || ''}
                        />
                    )}
                    {currentView === 'PENDING_REQUESTS' && (
                        <PendingRequests 
                            requests={pendingRequests} 
                            stock={stock}
                            onApprove={handleApproveRequest}
                            onReject={handleRejectRequest}
                        />
                    )}
                </main>
            </div>


            <Modal isOpen={activeModal === 'GOODS_IN'} onClose={() => setActiveModal(null)} title="Goods In">
                <GoodsInForm 
                    onAddStock={handleAddStock}
                    onClose={() => setActiveModal(null)}
                    currentUser={currentUser || ''}
                    itemCodes={itemCodes}
                    userRole={currentUserRole}
                />
            </Modal>
            <Modal isOpen={activeModal === 'GOODS_OUT'} onClose={() => setActiveModal(null)} title="Goods Out">
                <GoodsOutForm
                    onRemoveStock={handleRemoveStock}
                    stock={stock}
                    onClose={() => setActiveModal(null)}
                    currentUser={currentUser || ''}
                    userRole={currentUserRole}
                />
            </Modal>
             <Modal isOpen={activeModal === 'PALLET_SHIFT'} onClose={() => setActiveModal(null)} title="Shift Pallet">
                <PalletShiftForm
                    onMoveStock={handleMoveStock}
                    stock={stock}
                    onClose={() => setActiveModal(null)}
                    currentUser={currentUser || ''}
                />
            </Modal>
             <Modal isOpen={!!selectedLocation} onClose={() => setSelectedLocation(null)} title={`Items in Location: ${selectedLocation}`}>
                {itemsInSelectedLocation.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PCS</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">KGS</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prod. Date</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {itemsInSelectedLocation.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemCode}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.pcs.toLocaleString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.kgs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.productionDate ? new Date(item.productionDate).toLocaleDateString() : '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 font-semibold">{new Date(item.expiryDate).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">This location is empty.</p>
                )}
            </Modal>
        </div>
    );
};

export default App;
