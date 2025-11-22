
import React from 'react';
import { BoxIcon, DocumentReportIcon, CalendarAlertIcon, GridIcon, LogoutIcon, CogIcon } from './ui/Icons';

type View = 'DASHBOARD' | 'REPORTS' | 'EXPIRY_REPORT' | 'LOCATIONS' | 'SETTINGS';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentView: View;
    setCurrentView: (view: View) => void;
    currentUser: string | null;
    userRole: 'ADMIN' | 'USER' | 'VIEWER';
    onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, currentView, setCurrentView, currentUser, userRole, onLogout }) => {
    
    const NavButton: React.FC<{
        view: View;
        label: string;
        icon: React.ReactNode;
    }> = ({ view, label, icon }) => (
        <button
            onClick={() => {
                setCurrentView(view);
                setIsOpen(false); // Close sidebar on selection (for mobile)
            }}
            className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentView === view
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-red-200 hover:bg-white/5 hover:text-white'
            }`}
        >
            {icon}
            <span>{label}</span>
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
                className={`fixed top-0 left-0 w-64 h-full bg-red-700 text-white z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
            >
                <div className="flex items-center gap-3 p-5 border-b border-red-800/50">
                    <BoxIcon className="w-9 h-9 flex-shrink-0"/>
                    <h1 className="text-xl font-bold tracking-tight">BSI DP Cold Storage</h1>
                </div>

                <nav className="flex-grow p-4 space-y-2">
                    <NavButton view="DASHBOARD" label="Dashboard" icon={<BoxIcon className="w-6 h-6"/>} />
                    <NavButton view="LOCATIONS" label="Locations" icon={<GridIcon className="w-6 h-6"/>} />
                    <NavButton view="REPORTS" label="Reports" icon={<DocumentReportIcon className="w-6 h-6"/>} />
                    <NavButton view="EXPIRY_REPORT" label="Expiry Report" icon={<CalendarAlertIcon className="w-6 h-6"/>} />
                    {userRole === 'ADMIN' && (
                        <div className="pt-2 mt-2 border-t border-red-800/50">
                            <NavButton view="SETTINGS" label="Settings" icon={<CogIcon className="w-6 h-6"/>} />
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-red-800/50">
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
