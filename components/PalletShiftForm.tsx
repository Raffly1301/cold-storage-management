
import React, { useState, useEffect } from 'react';
import { StockItem, Transaction, TransactionType } from '../types';
import { STORAGE_LOCATIONS } from '../constants';

interface PalletShiftFormProps {
  onMoveStock: (details: { stockId: string; newLocation: string; pcs: number; kgs: number }, transaction: Transaction) => void;
  stock: StockItem[];
  onClose: () => void;
  currentUser: string;
}

export const PalletShiftForm: React.FC<PalletShiftFormProps> = ({ onMoveStock, stock, onClose, currentUser }) => {
  const [selectedStockId, setSelectedStockId] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [pcsToMove, setPcsToMove] = useState('');
  const [kgsToMove, setKgsToMove] = useState('');
  const [error, setError] = useState('');
  
  const selectedStock = stock.find(s => s.id === selectedStockId);

  useEffect(() => {
    if (selectedStock) {
      setPcsToMove(selectedStock.pcs.toString());
      setKgsToMove(selectedStock.kgs.toString());
    } else {
      setPcsToMove('');
      setKgsToMove('');
    }
  }, [selectedStockId, selectedStock]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pcsNum = parseInt(pcsToMove, 10);
    const kgsNum = parseFloat(kgsToMove);

    if (!selectedStockId || !selectedStock) {
      setError('Please select an item to move.');
      return;
    }
    if (!newLocation) {
      setError('Please select a new destination location.');
      return;
    }
     if (selectedStock.location === newLocation) {
        setError('The new location must be different from the current location.');
        return;
    }
    if (isNaN(pcsNum) || pcsNum <= 0) {
        setError('PCS to move must be a positive number.');
        return;
    }
     if (isNaN(kgsNum) || kgsNum <= 0) {
        setError('KGS to move must be a positive number.');
        return;
    }
    if (pcsNum > selectedStock.pcs) {
        setError(`Cannot move more than the available ${selectedStock.pcs} PCS.`);
        return;
    }
    if (kgsNum > selectedStock.kgs) {
        setError(`Cannot move more than the available ${selectedStock.kgs} KGS.`);
        return;
    }

    const movedItemForTransaction: StockItem = {
      ...selectedStock,
      pcs: pcsNum,
      kgs: kgsNum,
    };

    const transaction: Transaction = {
        id: `TRN-${Date.now()}`,
        type: TransactionType.SHIFT,
        item: movedItemForTransaction,
        timestamp: new Date().toISOString(),
        fromLocation: selectedStock.location,
        toLocation: newLocation,
        username: currentUser,
    }

    onMoveStock({ stockId: selectedStockId, newLocation, pcs: pcsNum, kgs: kgsNum }, transaction);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700">Item to Move</label>
        <select value={selectedStockId} onChange={(e) => setSelectedStockId(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
          <option value="">Select an item...</option>
          {stock.map(item => (
            <option key={item.id} value={item.id}>
              {item.itemCode} - {item.pcs} pcs / {item.kgs} kgs @ {item.location}
            </option>
          ))}
        </select>
      </div>
      {selectedStock && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md border">
            <div>
                <label className="block text-sm font-medium text-gray-700">PCS to Move</label>
                <input type="number" value={pcsToMove} onChange={e => setPcsToMove(e.target.value)} max={selectedStock.pcs} min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                <p className="text-xs text-gray-500 mt-1">Max: {selectedStock.pcs}</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">KGS to Move</label>
                <input type="number" step="0.01" value={kgsToMove} onChange={e => setKgsToMove(e.target.value)} max={selectedStock.kgs} min="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
                <p className="text-xs text-gray-500 mt-1">Max: {selectedStock.kgs.toFixed(2)}</p>
            </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">New Location</label>
        <select value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
          <option value="">Select a new location...</option>
          {STORAGE_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>
      <div className="flex justify-end pt-2">
        <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          Move Pallet
        </button>
      </div>
    </form>
  );
};