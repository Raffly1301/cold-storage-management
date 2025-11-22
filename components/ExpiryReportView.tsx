
import React from 'react';
import { StockItem } from '../types';

interface ExpiryReportViewProps {
  stock: StockItem[];
}

export const ExpiryReportView: React.FC<ExpiryReportViewProps> = ({ stock }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  thirtyDaysFromNow.setHours(0, 0, 0, 0);

  const parseDate = (dateString: string) => {
    const parts = dateString.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  };
  
  const expiredItems = stock.filter(item => parseDate(item.expiryDate) < today);
  const expiringSoonItems = stock.filter(item => {
    const expiry = parseDate(item.expiryDate);
    return expiry >= today && expiry <= thirtyDaysFromNow;
  });

  const StockTable: React.FC<{ items: StockItem[], title: string, highlightClass?: string }> = ({ items, title, highlightClass }) => (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KGS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.length > 0 ? items.map(item => (
              <tr key={item.id} className={highlightClass}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{item.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.pcs.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.kgs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.entryDate).toLocaleDateString()}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${highlightClass ? (highlightClass.includes('red') ? 'text-red-700' : 'text-yellow-700') : 'text-gray-500'}`}>{new Date(item.expiryDate).toLocaleDateString()}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No items in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <StockTable items={expiredItems} title="Expired Items" highlightClass="bg-red-100" />
      <StockTable items={expiringSoonItems} title="Expiring Soon (Next 30 Days)" highlightClass="bg-yellow-100" />
    </div>
  );
};