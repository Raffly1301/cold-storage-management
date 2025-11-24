
import React, { useState } from 'react';
import { PendingRequest, StockItem } from '../types';
import { CloseIcon } from './ui/Icons';

interface PendingRequestsProps {
    requests: PendingRequest[];
    stock: StockItem[];
    onApprove: (request: PendingRequest, updatedData?: any) => Promise<void>;
    onReject: (request: PendingRequest) => Promise<void>;
}

export const PendingRequests: React.FC<PendingRequestsProps> = ({ requests, stock, onApprove, onReject }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>(null);

    const handleStartEdit = (req: PendingRequest) => {
        setEditingId(req.id);
        setEditData(JSON.parse(JSON.stringify(req.data))); // Deep copy
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData(null);
    };

    const handleConfirmApprove = async (req: PendingRequest) => {
        if (editingId === req.id && editData) {
            await onApprove(req, editData);
        } else {
            await onApprove(req);
        }
        handleCancelEdit();
    };

    // Helper to update nested data during edit
    const updateEditData = (index: number, field: string, value: any) => {
        const newData = [...editData];
        newData[index] = { ...newData[index], [field]: value };
        setEditData(newData);
    };

    if (requests.length === 0) {
        return (
            <div className="p-10 text-center bg-white rounded-lg shadow-md">
                <p className="text-gray-500 text-lg">No pending requests.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Pending Requests</h2>
            
            <div className="grid gap-6">
                {requests.map((req) => {
                    const isEditing = editingId === req.id;
                    const dataToDisplay = isEditing ? editData : req.data;

                    return (
                        <div key={req.id} className="bg-white border rounded-lg shadow-sm p-5 transition-shadow hover:shadow-md">
                            <div className="flex justify-between items-start mb-4 border-b pb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${req.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            GOODS {req.type}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            from <strong>{req.requester}</strong> on {new Date(req.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <button 
                                                onClick={handleCancelEdit} 
                                                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => handleConfirmApprove(req)} 
                                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
                                            >
                                                Confirm & Approve
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => handleStartEdit(req)} 
                                                className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                                            >
                                                Edit / Revise
                                            </button>
                                            <button 
                                                onClick={() => onReject(req)} 
                                                className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                onClick={() => onApprove(req)} 
                                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
                                            >
                                                Approve
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Data Display / Edit Area */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Code</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PCS</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">KGS</th>
                                            {req.type === 'IN' && (
                                                <>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prod. Date</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                                </>
                                            )}
                                            {req.type === 'OUT' && (
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source Stock ID</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {Array.isArray(dataToDisplay) && dataToDisplay.map((item: any, idx: number) => {
                                             // Resolve stock item for Goods Out to show details
                                            let stockInfo = null;
                                            if (req.type === 'OUT') {
                                                stockInfo = stock.find(s => s.id === item.stockId);
                                            }

                                            return (
                                                <tr key={idx}>
                                                    <td className="px-4 py-2">
                                                        {isEditing && req.type === 'IN' ? (
                                                            <input 
                                                                className="border rounded px-1 w-full" 
                                                                value={item.itemCode} 
                                                                onChange={e => updateEditData(idx, 'itemCode', e.target.value)} 
                                                            />
                                                        ) : (
                                                            req.type === 'OUT' ? (stockInfo?.itemCode || 'Unknown') : item.itemCode
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {isEditing ? (
                                                             <input 
                                                                type="number" 
                                                                className="border rounded px-1 w-20" 
                                                                value={item.pcs} 
                                                                onChange={e => updateEditData(idx, 'pcs', parseInt(e.target.value))} 
                                                            />
                                                        ) : item.pcs}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                         {isEditing ? (
                                                             <input 
                                                                type="number" 
                                                                step="0.01"
                                                                className="border rounded px-1 w-20" 
                                                                value={item.kgs} 
                                                                onChange={e => updateEditData(idx, 'kgs', parseFloat(e.target.value))} 
                                                            />
                                                        ) : (typeof item.kgs === 'number' ? item.kgs.toFixed(2) : item.kgs)}
                                                    </td>

                                                    {req.type === 'IN' && (
                                                        <>
                                                            <td className="px-4 py-2">
                                                                {isEditing ? (
                                                                     <input 
                                                                        type="date" 
                                                                        className="border rounded px-1 w-32" 
                                                                        value={item.productionDate} 
                                                                        onChange={e => updateEditData(idx, 'productionDate', e.target.value)} 
                                                                    />
                                                                ) : item.productionDate || '-'}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                {isEditing ? (
                                                                     <input 
                                                                        type="date" 
                                                                        className="border rounded px-1 w-32" 
                                                                        value={item.expiryDate} 
                                                                        onChange={e => updateEditData(idx, 'expiryDate', e.target.value)} 
                                                                    />
                                                                ) : item.expiryDate}
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                {isEditing ? (
                                                                     <input 
                                                                        className="border rounded px-1 w-24" 
                                                                        value={item.location} 
                                                                        onChange={e => updateEditData(idx, 'location', e.target.value)} 
                                                                    />
                                                                ) : item.location}
                                                            </td>
                                                        </>
                                                    )}
                                                    
                                                    {req.type === 'OUT' && (
                                                         <td className="px-4 py-2 text-xs text-gray-500 font-mono">
                                                             {item.stockId} {stockInfo ? `(@${stockInfo.location})` : '(Item not found)'}
                                                         </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
