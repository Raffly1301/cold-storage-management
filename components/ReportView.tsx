
import React, { useState } from 'react';
import { StockItem, Transaction, TransactionType } from '../types';
import { DownloadIcon } from './ui/Icons';

interface ReportViewProps {
  stock: StockItem[];
  transactions: Transaction[];
}

interface EndingStock {
    [itemCode: string]: {
        pcs: number;
        kgs: number;
    }
}

interface StockMovementReportData {
    itemCode: string;
    openingPcs: number;
    openingKgs: number;
    inPcs: number;
    inKgs: number;
    outPcs: number;
    outKgs: number;
    endingPcs: number;
    endingKgs: number;
}

const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                let cell = row[header] === null || row[header] === undefined ? '' : row[header];
                if (typeof cell === 'string') {
                    // Escape quotes by doubling them and wrap the whole cell in quotes if it contains a comma.
                    cell = cell.replace(/"/g, '""');
                    if (cell.includes(',')) {
                        cell = `"${cell}"`;
                    }
                }
                return cell;
            }).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};


export const ReportView: React.FC<ReportViewProps> = ({ stock, transactions }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [movementReport, setMovementReport] = useState<StockMovementReportData[] | null>(null);
    const [reportError, setReportError] = useState('');

    const endingStock = stock.reduce((acc, item) => {
        if (!acc[item.itemCode]) {
            acc[item.itemCode] = { pcs: 0, kgs: 0 };
        }
        acc[item.itemCode].pcs += item.pcs;
        acc[item.itemCode].kgs += item.kgs;
        return acc;
    }, {} as EndingStock);

    const handleGenerateReport = () => {
        setReportError('');
        if (!startDate || !endDate) {
            setReportError('Please select both a start and end date.');
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (start > end) {
            setReportError('Start date cannot be after end date.');
            return;
        }

        const allItemCodes = Array.from(new Set(transactions.map(t => t.item.itemCode)));
        
        const reportData = allItemCodes.map(itemCode => {
            let openingPcs = 0;
            let openingKgs = 0;
            let inPcs = 0;
            let inKgs = 0;
            let outPcs = 0;
            let outKgs = 0;

            transactions.forEach(trx => {
                if (trx.item.itemCode !== itemCode) return;

                const trxDate = new Date(trx.timestamp);
                
                // Calculate opening stock (transactions before the start date)
                if (trxDate < start) {
                    if (trx.type === TransactionType.IN) {
                        openingPcs += trx.item.pcs;
                        openingKgs += trx.item.kgs;
                    } else if (trx.type === TransactionType.OUT) {
                        openingPcs -= trx.item.pcs;
                        openingKgs -= trx.item.kgs;
                    }
                }
                
                // Calculate transactions within the date range
                if (trxDate >= start && trxDate <= end) {
                     if (trx.type === TransactionType.IN) {
                        inPcs += trx.item.pcs;
                        inKgs += trx.item.kgs;
                    } else if (trx.type === TransactionType.OUT) {
                        outPcs += trx.item.pcs;
                        outKgs += trx.item.kgs;
                    }
                }
            });

            const endingPcs = openingPcs + inPcs - outPcs;
            const endingKgs = openingKgs + inKgs - outKgs;

            return { itemCode, openingPcs, openingKgs, inPcs, inKgs, outPcs, outKgs, endingPcs, endingKgs };
        });

        setMovementReport(reportData);
    };

    const handleDownloadMovementReport = () => {
        if (!movementReport) return;
        const dataToDownload = movementReport.map(
            ({ itemCode, openingPcs, openingKgs, inPcs, inKgs, outPcs, outKgs, endingPcs, endingKgs }) => ({
                'Item Code': itemCode,
                'Opening PCS': openingPcs,
                'Opening KGS': openingKgs.toFixed(2),
                'In PCS': inPcs,
                'In KGS': inKgs.toFixed(2),
                'Out PCS': outPcs,
                'Out KGS': outKgs.toFixed(2),
                'Ending PCS': endingPcs,
                'Ending KGS': endingKgs.toFixed(2),
            })
        );
        downloadCSV(dataToDownload, `stock_movement_report_${startDate}_to_${endDate}.csv`);
    };

    const handleDownloadEndingStock = () => {
        const dataToDownload = Object.keys(endingStock).map(itemCode => ({
            'Item Code': itemCode,
            'Total PCS': endingStock[itemCode].pcs,
            'Total KGS': endingStock[itemCode].kgs.toFixed(2),
        }));
        downloadCSV(dataToDownload, 'current_ending_stock.csv');
    };

    const handleDownloadTransactions = () => {
        const dataToDownload = [...transactions].reverse().map(trx => {
            let locationInfo = '';
            if (trx.type === TransactionType.IN) locationInfo = `To: ${trx.toLocation}`;
            if (trx.type === TransactionType.OUT) locationInfo = `From: ${trx.fromLocation}`;
            if (trx.type === TransactionType.SHIFT) locationInfo = `From: ${trx.fromLocation} -> To: ${trx.toLocation}`;

            return {
                Type: trx.type,
                'Item Code': trx.item.itemCode,
                PCS: trx.item.pcs,
                KGS: trx.item.kgs.toFixed(2),
                'Prod. Date': trx.item.productionDate ? new Date(trx.item.productionDate).toLocaleDateString() : '',
                'Expiry Date': new Date(trx.item.expiryDate).toLocaleDateString(),
                'Location Info': locationInfo,
                User: trx.username,
                Timestamp: new Date(trx.timestamp).toLocaleString(),
            };
        });
        downloadCSV(dataToDownload, 'transaction_history.csv');
    };


  return (
    <div className="space-y-8">
       <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">Stock Movement Report</h2>
                <button 
                    onClick={handleDownloadMovementReport}
                    disabled={!movementReport || movementReport.length === 0}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed py-2 px-3 rounded-md transition-colors"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Download CSV
                </button>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                        <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"/>
                    </div>
                    <button onClick={handleGenerateReport} className="w-full md:w-auto justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        Generate Report
                    </button>
                </div>
                {reportError && <p className="text-red-500 text-sm mt-2">{reportError}</p>}
            </div>
            {movementReport && (
                 <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th rowSpan={2} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider align-middle border-b border-r">Item Code</th>
                                <th colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">Opening Stock</th>
                                <th colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">In</th>
                                <th colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">Out</th>
                                <th colSpan={2} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Ending Stock</th>
                            </tr>
                            <tr>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">PCS</th>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">KGS</th>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">PCS</th>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">KGS</th>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">PCS</th>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">KGS</th>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCS</th>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KGS</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {movementReport.length > 0 ? movementReport.map(data => (
                                <tr key={data.itemCode}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">{data.itemCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.openingPcs.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">{data.openingKgs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{data.inPcs.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 border-r">{data.inKgs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{data.outPcs.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 border-r">{data.outKgs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{data.endingPcs.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{data.endingKgs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={9} className="text-center py-4 text-sm text-gray-500">No transactions found for this period.</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            )}
        </div>
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Current Ending Stock</h2>
            <button
                 onClick={handleDownloadEndingStock}
                 disabled={Object.keys(endingStock).length === 0}
                 className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed py-2 px-3 rounded-md transition-colors"
            >
                <DownloadIcon className="w-4 h-4" />
                Download CSV
            </button>
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total PCS</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total KGS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(endingStock).length > 0 ? (
                // FIX: Replaced Object.entries with Object.keys to fix type inference issues where `totals` was of type `unknown`.
                Object.keys(endingStock).map((itemCode) => (
                    <tr key={itemCode}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{itemCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{endingStock[itemCode].pcs.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{endingStock[itemCode].kgs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={3} className="text-center py-4 text-sm text-gray-500">No stock available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Transaction History</h2>
            <button
                onClick={handleDownloadTransactions}
                disabled={transactions.length === 0}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed py-2 px-3 rounded-md transition-colors"
            >
                <DownloadIcon className="w-4 h-4" />
                Download CSV
            </button>
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PCS</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KGS</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prod. Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Info</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length > 0 ? (
                [...transactions].reverse().map(trx => (
                  <tr key={trx.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          trx.type === TransactionType.IN ? 'bg-green-100 text-green-800' :
                          trx.type === TransactionType.OUT ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                          {trx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trx.item.itemCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trx.item.pcs.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trx.item.kgs.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trx.item.productionDate ? new Date(trx.item.productionDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {trx.type === TransactionType.IN && `To: ${trx.toLocation}`}
                        {trx.type === TransactionType.OUT && `From: ${trx.fromLocation}`}
                        {trx.type === TransactionType.SHIFT && `From: ${trx.fromLocation} -> To: ${trx.toLocation}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">{trx.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(trx.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                 <tr>
                    <td colSpan={8} className="text-center py-4 text-sm text-gray-500">No transactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
