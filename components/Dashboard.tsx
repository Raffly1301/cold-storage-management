
import React, { useState } from 'react';
import { StockItem } from '../types';
import { ArrowDownIcon, ArrowUpIcon, SwitchHorizontalIcon } from './ui/Icons';

interface DashboardProps {
    stock: StockItem[];
    onOpenGoodsIn: () => void;
    onOpenGoodsOut: () => void;
    onOpenPalletShift: () => void;
    userRole: 'ADMIN' | 'USER' | 'VIEWER';
}

export const Dashboard: React.FC<DashboardProps> = ({ stock, onOpenGoodsIn, onOpenGoodsOut, onOpenPalletShift, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredStock = stock.filter(item => 
        item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        totalItems: stock.reduce((sum, item) => sum + item.pcs, 0),
        totalWeight: stock.reduce((sum, item) => sum + item.kgs, 0),
        locationsUsed: stock.length,
    };

    // A helper function to determine the styling for rows based on expiry date
    const getExpiryStyling = (expiryDateString: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Correctly parse YYYY-MM-DD to avoid timezone issues
        const parts = expiryDateString.split('-');
        const expiry = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setHours(0, 0, 0, 0);
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        if (expiry < today) {
            return {
                rowClass: 'bg-red-100 hover:bg-red-200 transition-colors duration-200',
                dateClass: 'text-red-700 font-bold'
            }; // Expired
        }
        if (expiry <= thirtyDaysFromNow) {
            return {
                rowClass: 'bg-yellow-100 hover:bg-yellow-200 transition-colors duration-200',
                dateClass: 'text-yellow-700 font-semibold'
            }; // Expiring soon
        }
        return {
            rowClass: 'hover:bg-gray-50 transition-colors duration-200',
            dateClass: 'text-gray-500'
        }; // Default
    };


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Items (PCS)</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalItems.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Weight (KGS)</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Locations Used</p>
                        <p className="text-3xl font-bold text-gray-900">{stats.locationsUsed}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <input
                        type="text"
                        placeholder="Search by Item Code or Location..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                {userRole !== 'VIEWER' && (
                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={onOpenGoodsIn} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-green-600 transition duration-200">
                            <ArrowDownIcon className="w-5 h-5" /> Goods In
                        </button>
                        <button onClick={onOpenGoodsOut} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-red-600 transition duration-200">
                            <ArrowUpIcon className="w-5 h-5" /> Goods Out
                        </button>
                        <button onClick={onOpenPalletShift} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:bg-blue-600 transition duration-200">
                            <SwitchHorizontalIcon className="w-5 h-5" /> Shift Pallet
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCS</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KGS</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prod. Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStock.length > 0 ? filteredStock.map(item => {
                            const { rowClass, dateClass } = getExpiryStyling(item.expiryDate);
                            return (
                                <tr key={item.id} className={rowClass}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{item.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.pcs.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.kgs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.productionDate ? new Date(item.productionDate).toLocaleDateString() : '-'}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${dateClass}`}>{new Date(item.expiryDate).toLocaleDateString()}</td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-500">
                                    No stock found. {userRole !== 'VIEWER' ? 'Use the "Goods In" button to add items.' : ''}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
