
import React from 'react';
import { BoxIcon, DocumentReportIcon, CalendarAlertIcon, GridIcon, LogoutIcon, CogIcon } from './ui/Icons';

type View = 'DASHBOARD' | 'REPORTS' | 'EXPIRY_REPORT' | 'LOCATIONS' | 'SETTINGS' | 'PENDING_REQUESTS';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentView: View;
    setCurrentView: (view: View) => void;
    currentUser: string | null;
    userRole: 'ADMIN' | 'USER' | 'VIEWER';
    onLogout: () => void;
    pendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentView, setCurrentView, currentUser, userRole, onLogout, pendingCount }) => {
    
    const NavButton: React.FC<{
        view: View;
        label: string;
        icon: React.ReactNode;
        badge?: number;
    }> = ({ view, label, icon, badge }) => (
        <button
            onClick={() => {
                setCurrentView(view);
                setIsOpen(false); // Close sidebar on selection (for mobile)
            }}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentView === view
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-red-200 hover:bg-white/5 hover:text-white'
            }`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span>{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className="bg-white text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </button>
    );

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Sidebar Panel */}
            <aside
                className={`fixed top-0 left-0 w-64 h-[100dvh] bg-red-700 text-white z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
            >
                {/* Header (Logo) - Fixed height */}
                <div className="flex items-center gap-3 p-5 border-b border-red-800/50 flex-shrink-0">
                    <BoxIcon className="w-9 h-9 flex-shrink-0"/>
                    <h1 className="text-xl font-bold tracking-tight">BSI DP Cold Storage</h1>
                </div>

                {/* Navigation - Scrollable */}
                <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                    <NavButton view="DASHBOARD" label="Dashboard" icon={<BoxIcon className="w-6 h-6"/>} />
                    <NavButton view="LOCATIONS" label="Locations" icon={<GridIcon className="w-6 h-6"/>} />
                    
                    {userRole === 'ADMIN' && (
                        <NavButton 
                            view="PENDING_REQUESTS" 
                            label="Pending Requests" 
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            } 
                            badge={pendingCount}
                        />
                    )}

                    <NavButton view="REPORTS" label="Reports" icon={<DocumentReportIcon className="w-6 h-6"/>} />
                    <NavButton view="EXPIRY_REPORT" label="Expiry Report" icon={<CalendarAlertIcon className="w-6 h-6"/>} />
                    
                    {userRole === 'ADMIN' && (
                        <div className="pt-2 mt-2 border-t border-red-800/50">
                            <NavButton view="SETTINGS" label="Settings" icon={<CogIcon className="w-6 h-6"/>} />
                        </div>
                    )}
                </nav>

                {/* Footer (User Info & Logout) - Fixed at bottom */}
                <div className="p-4 border-t border-red-800/50 flex-shrink-0 bg-red-700">
                    <div className="mb-3">
                        <p className="text-xs text-red-200">Welcome,</p>
                        <p className="font-semibold text-white truncate">{currentUser}</p>
                        <p className="text-xs text-red-300 mt-1 capitalize">{userRole.toLowerCase()}</p>
                    </div>
                    <button 
                        onClick={onLogout} 
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-red-200 bg-red-600 hover:bg-red-500 rounded-md px-3 py-2.5 transition-colors duration-200"
                    >
                        <LogoutIcon className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
