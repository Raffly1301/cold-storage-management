
import React, { useState } from 'react';
import { StockItem, TransactionType, Transaction } from '../types';
import { STORAGE_LOCATIONS } from '../constants';
import { PlusIcon, CloseIcon } from './ui/Icons';

interface GoodsInFormProps {
  onAddStock: (stocks: StockItem[], transactions: Transaction[]) => void;
  onClose: () => void;
  currentUser: string;
  itemCodes: string[];
}

interface FormItem {
  id: number;
  itemCode: string;
  pcs: string;
  kgs: string;
  productionDate: string;
  expiryDate: string;
  location: string;
  error?: string;
}

export const GoodsInForm: React.FC<GoodsInFormProps> = ({ onAddStock, onClose, currentUser, itemCodes }) => {
  const [items, setItems] = useState<FormItem[]>([{
    id: Date.now(),
    itemCode: '',
    pcs: '',
    kgs: '',
    productionDate: '',
    expiryDate: '',
    location: '',
  }]);
  const [globalError, setGlobalError] = useState('');

  const handleItemChange = (index: number, field: keyof Omit<FormItem, 'id' | 'error'>, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (newItems[index].error) {
        newItems[index].error = undefined; // Clear error on change
    }
    setItems(newItems);
  };

  const addItem = () => {
    if (items.length < 10) {
      setItems([...items, {
        id: Date.now(),
        itemCode: '',
        pcs: '',
        kgs: '',
        productionDate: '',
        expiryDate: '',
        location: '',
      }]);
    }
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  // Helper to set expiry date based on months from Production Date (or Today)
  const setExpiryByMonths = (index: number, months: number) => {
    const newItems = [...items];
    const item = newItems[index];
    
    // Base date is Production Date if set, otherwise Today
    const baseDate = item.productionDate ? new Date(item.productionDate) : new Date();
    
    // Add months
    baseDate.setMonth(baseDate.getMonth() + months);
    
    // Format as YYYY-MM-DD
    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');
    
    item.expiryDate = `${year}-${month}-${day}`;
    
    // Clear error if exists
    if (item.error) item.error = undefined;
    
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    let isValid = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validatedItems = items.map(item => {
        const newItem = {...item, error: undefined};

        if (!newItem.itemCode) {
            newItem.error = 'Item Code is required.';
            isValid = false;
        } else if (!newItem.pcs || parseInt(newItem.pcs, 10) <= 0) {
            newItem.error = 'PCS must be a positive number.';
            isValid = false;
        } else if (!newItem.kgs || parseFloat(newItem.kgs) <= 0) {
            newItem.error = 'KGS must be a positive number.';
            isValid = false;
        } else if (!newItem.expiryDate) {
            newItem.error = 'Expiry Date is required.';
            isValid = false;
        } else if (!newItem.location) {
            newItem.error = 'A storage location must be selected.';
            isValid = false;
        }
        
        return newItem;
    });

    setItems(validatedItems);

    if (!isValid) {
        setGlobalError('Please fix the errors highlighted below.');
        return;
    }

    // Check for expired items and ask for confirmation
    const expiredItems = items.filter(item => {
        if (!item.expiryDate) return false;
        const expDate = new Date(item.expiryDate);
        // Reset time part for accurate date comparison
        expDate.setHours(0,0,0,0);
        return expDate < today;
    });

    if (expiredItems.length > 0) {
        const confirmMsg = `Warning: ${expiredItems.length} item(s) have an expiry date in the past (Expired).\n\nDo you want to proceed and add them anyway?`;
        if (!window.confirm(confirmMsg)) {
            return; // Stop if user cancels
        }
    }

    const newStockItems: StockItem[] = [];
    const newTransactions: Transaction[] = [];
    const timestamp = new Date().toISOString();

    items.forEach((item, index) => {
        const stockId = `STK-${Date.now()}-${index}`;
        const newStockItem: StockItem = {
            id: stockId,
            itemCode: item.itemCode,
            pcs: parseInt(item.pcs),
            kgs: parseFloat(item.kgs),
            productionDate: item.productionDate,
            expiryDate: item.expiryDate,
            location: item.location,
            entryDate: timestamp,
        };
        newStockItems.push(newStockItem);

        const newTransaction: Transaction = {
            id: `TRN-${Date.now()}-${index}`,
            type: TransactionType.IN,
            item: newStockItem,
            timestamp: timestamp,
            toLocation: item.location,
            username: currentUser,
        }
        newTransactions.push(newTransaction);
    });

    onAddStock(newStockItems, newTransactions);
    onClose();
  };

  const ExpiryPresetButton: React.FC<{ label: string; months: number; index: number }> = ({ label, months, index }) => (
    <button
        type="button"
        onClick={() => setExpiryByMonths(index, months)}
        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
    >
        {label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {globalError && <p className="text-red-500 text-sm font-semibold text-center">{globalError}</p>}
      
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {items.map((item, index) => (
            <div key={item.id} className="p-4 border rounded-lg relative space-y-4 bg-gray-50">
                {items.length > 1 && (
                     <button type="button" onClick={() => removeItem(index)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                )}
                
                {item.error && <p className="text-red-500 text-xs font-semibold">{item.error}</p>}
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">Item Code</label>
                    <select 
                        value={item.itemCode} 
                        onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)} 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    >
                        <option value="">
                           Select an Item Code
                        </option>
                        {itemCodes.map(code => <option key={code} value={code}>{code}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700">PCS</label>
                    <input type="number" value={item.pcs} onChange={(e) => handleItemChange(index, 'pcs', e.target.value)} min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700">KGS</label>
                    <input type="number" step="0.01" value={item.kgs} onChange={(e) => handleItemChange(index, 'kgs', e.target.value)} min="0.1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Production Date</label>
                        <input type="date" value={item.productionDate} onChange={(e) => handleItemChange(index, 'productionDate', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                        <p className="text-xs text-gray-400 mt-1">Optional (Base for Expiry)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                             <ExpiryPresetButton label="+6 Mo" months={6} index={index} />
                             <ExpiryPresetButton label="+1 Yr" months={12} index={index} />
                             <ExpiryPresetButton label="+1.5 Yr" months={18} index={index} />
                             <ExpiryPresetButton label="+2 Yr" months={24} index={index} />
                        </div>
                        <input type="date" value={item.expiryDate} onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <select value={item.location} onChange={(e) => handleItemChange(index, 'location', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                    <option value="">Select a location</option>
                    {STORAGE_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                </div>
            </div>
        ))}
      </div>

      {items.length < 10 && (
          <button type="button" onClick={addItem} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              <PlusIcon className="w-5 h-5" />
              Add Another Item
          </button>
      )}

      <div className="flex justify-end pt-2">
        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          Add {items.length} {items.length > 1 ? 'Items' : 'Item'} to Stock
        </button>
      </div>
    </form>
  );
};
