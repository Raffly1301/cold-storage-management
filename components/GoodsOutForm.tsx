
import React, { useState } from 'react';
import { StockItem, Transaction, TransactionType } from '../types';
import { PlusIcon, CloseIcon } from './ui/Icons';

interface GoodsOutFormProps {
  onRemoveStock: (details: { stockId: string; pcs: number; kgs: number }[], transactions: Transaction[]) => void;
  stock: StockItem[];
  onClose: () => void;
  currentUser: string;
  userRole: 'ADMIN' | 'USER' | 'VIEWER';
}

interface FormItem {
  id: number;
  stockId: string;
  pcs: string;
  kgs: string;
  error?: string;
}

export const GoodsOutForm: React.FC<GoodsOutFormProps> = ({ onRemoveStock, stock, onClose, currentUser, userRole }) => {
  const [items, setItems] = useState<FormItem[]>([{
    id: Date.now(),
    stockId: '',
    pcs: '',
    kgs: '',
  }]);
  const [globalError, setGlobalError] = useState('');

  const handleItemChange = (index: number, field: keyof Omit<FormItem, 'id' | 'error'>, value: string) => {
    const newItems = [...items];
    const currentItem = newItems[index];
    currentItem[field] = value;
    if (currentItem.error) {
        currentItem.error = undefined;
    }

    if (field === 'stockId') {
      const selectedStock = stock.find(s => s.id === value);
      if (selectedStock) {
        currentItem.pcs = selectedStock.pcs.toString();
        currentItem.kgs = selectedStock.kgs.toString();
      } else {
        currentItem.pcs = '';
        currentItem.kgs = '';
      }
    }
    setItems(newItems);
  };

  const addItem = () => {
    if (items.length < 10) {
      setItems([...items, {
        id: Date.now(),
        stockId: '',
        pcs: '',
        kgs: '',
      }]);
    }
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    
    let isValid = true;
    const validatedItems = items.map(item => {
        const newItem = {...item, error: undefined};
        const selectedStock = stock.find(s => s.id === item.stockId);

        if (!item.stockId || !selectedStock) {
            newItem.error = 'Please select a stock item.';
            isValid = false;
        } else {
            // Re-validate hold status in case it changed while form was open
            if (selectedStock.status === 'HOLD') {
                 newItem.error = 'This item is on QC HOLD and cannot be moved out.';
                 isValid = false;
            } else {
                const pcsNum = parseInt(item.pcs, 10);
                const kgsNum = parseFloat(item.kgs);
                if (isNaN(pcsNum) || pcsNum <= 0) {
                    newItem.error = 'PCS must be a positive number.';
                    isValid = false;
                } else if (isNaN(kgsNum) || kgsNum <= 0) {
                    newItem.error = 'KGS must be a positive number.';
                    isValid = false;
                } else if (pcsNum > selectedStock.pcs) {
                    newItem.error = `Cannot take out more than the available ${selectedStock.pcs} PCS.`;
                    isValid = false;
                } else if (kgsNum > selectedStock.kgs) {
                    newItem.error = `Cannot take out more than the available ${selectedStock.kgs} KGS.`;
                    isValid = false;
                }
            }
        }
        return newItem;
    });
    
    const selectedIds = items.map(item => item.stockId).filter(id => id);
    if (new Set(selectedIds).size !== selectedIds.length) {
        setGlobalError('Each stock item can only be selected once per transaction.');
        isValid = false;
    }

    setItems(validatedItems);
    
    if (!isValid) {
        if (!globalError) {
            setGlobalError('Please fix the errors highlighted below.');
        }
        return;
    }
    
    const removalDetails: { stockId: string; pcs: number; kgs: number }[] = [];
    const newTransactions: Transaction[] = [];
    const timestamp = new Date().toISOString();

    items.forEach((item) => {
        const stockItem = stock.find(s => s.id === item.stockId)!;
        const pcsNum = parseInt(item.pcs, 10);
        const kgsNum = parseFloat(item.kgs);

        removalDetails.push({ stockId: item.stockId, pcs: pcsNum, kgs: kgsNum });

        const removedItemForTransaction: StockItem = {
            ...stockItem,
            pcs: pcsNum,
            kgs: kgsNum,
        };
        
        const newTransaction: Transaction = {
            id: `TRN-${Date.now()}-${item.id}`,
            type: TransactionType.OUT,
            item: removedItemForTransaction,
            timestamp: timestamp,
            fromLocation: stockItem.location,
            username: currentUser,
        }
        newTransactions.push(newTransaction);
    });

    onRemoveStock(removalDetails, newTransactions);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {globalError && <p className="text-red-500 text-sm font-semibold text-center">{globalError}</p>}
      
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {items.map((item, index) => {
          const availableStock = stock.filter(
            stockItem => !items.some((formItem, formItemIndex) => 
              formItem.stockId === stockItem.id && formItemIndex !== index
            )
          );
          const selectedStockInRow = stock.find(s => s.id === item.stockId);

          return (
            <div key={item.id} className="p-4 border rounded-lg relative space-y-4 bg-gray-50">
              {items.length > 1 && (
                     <button type="button" onClick={() => removeItem(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                )}
              {item.error && <p className="text-red-500 text-xs font-semibold">{item.error}</p>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Item to Remove</label>
                <select value={item.stockId} onChange={(e) => handleItemChange(index, 'stockId', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                  <option value="">Select an item...</option>
                  {availableStock.map(stockItem => (
                    <option 
                        key={stockItem.id} 
                        value={stockItem.id}
                        disabled={stockItem.status === 'HOLD'}
                        className={stockItem.status === 'HOLD' ? 'text-gray-400 bg-gray-100' : ''}
                    >
                      {stockItem.itemCode} - {stockItem.pcs} pcs @ {stockItem.location} 
                      {stockItem.status === 'HOLD' ? ' (ON QC HOLD)' : ` (Exp: ${new Date(stockItem.expiryDate).toLocaleDateString()})`}
                    </option>
                  ))}
                </select>
                {selectedStockInRow?.status === 'HOLD' && (
                     <p className="text-xs text-red-500 mt-1">This item is currently on QC Hold and cannot be removed.</p>
                )}
              </div>

              {selectedStockInRow && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">PCS to Take Out</label>
                        <input type="number" value={item.pcs} onChange={e => handleItemChange(index, 'pcs', e.target.value)} max={selectedStockInRow.pcs} min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                        <p className="text-xs text-gray-500 mt-1">Max: {selectedStockInRow.pcs}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">KGS to Take Out</label>
                        <input type="number" step="0.01" value={item.kgs} onChange={e => handleItemChange(index, 'kgs', e.target.value)} max={selectedStockInRow.kgs} min="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                        <p className="text-xs text-gray-500 mt-1">Max: {selectedStockInRow.kgs.toFixed(2)}</p>
                    </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {items.length < 10 && (
          <button type="button" onClick={addItem} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <PlusIcon className="w-5 h-5" />
              Add Another Item
          </button>
      )}

      <div className="flex justify-end pt-2">
        <button type="submit" className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${userRole === 'USER' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}>
          {userRole === 'USER' ? 'Submit Request for Approval' : `Confirm Goods Out for ${items.length} ${items.length > 1 ? 'Items' : 'Item'}`}
        </button>
      </div>
    </form>
  );
};
