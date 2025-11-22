
import React from 'react';
import { StockItem } from '../types';
import { STORAGE_LOCATIONS } from '../constants';
import { OccupancyHighIcon, OccupancyLowIcon, OccupancyMediumIcon } from './ui/Icons';

interface LocationViewProps {
  stock: StockItem[];
  onLocationClick: (location: string) => void;
}

export const LocationView: React.FC<LocationViewProps> = ({ stock, onLocationClick }) => {
  const stockByLocation = stock.reduce((acc, item) => {
    if (!acc[item.location]) {
      acc[item.location] = [];
    }
    acc[item.location].push(item);
    return acc;
  }, {} as Record<string, StockItem[]>);


  const locationsByRack = STORAGE_LOCATIONS.reduce((acc, loc) => {
    const rackId = loc.split('-')[0][0];
    if (!acc[rackId]) {
      acc[rackId] = [];
    }
    acc[rackId].push(loc);
    return acc;
  }, {} as Record<string, string[]>);
  
  const getOccupancyStyle = (itemCount: number) => {
    if (itemCount === 0) {
      return {
        className: 'bg-gray-100 border-gray-200 text-gray-400',
        icon: null,
        label: 'Empty'
      };
    } else if (itemCount <= 2) {
      return {
        className: 'bg-blue-100 border-blue-300 text-blue-800 cursor-pointer hover:bg-blue-200 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200',
        icon: <OccupancyLowIcon className="w-4 h-4 mx-auto text-blue-500" />,
        label: `${itemCount} item(s)`
      };
    } else if (itemCount <= 5) {
      return {
        className: 'bg-yellow-100 border-yellow-300 text-yellow-800 cursor-pointer hover:bg-yellow-200 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200',
        icon: <OccupancyMediumIcon className="w-4 h-4 mx-auto text-yellow-500" />,
        label: `${itemCount} item(s)`
      };
    } else {
       return {
        className: 'bg-red-100 border-red-300 text-red-800 cursor-pointer hover:bg-red-200 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200',
        icon: <OccupancyHighIcon className="w-4 h-4 mx-auto text-red-500" />,
        label: `${itemCount} item(s)`
      };
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Warehouse Locations</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {Object.keys(locationsByRack).sort().map(rackId => (
          <div key={rackId} className="space-y-2">
            <h3 className="text-lg font-bold text-center text-gray-700 bg-gray-200 py-2 rounded-t-md">Rack {rackId}</h3>
            <div className="grid grid-cols-2 gap-2">
              {locationsByRack[rackId].map(location => {
                const itemsInLocation = stockByLocation[location] || [];
                const itemCount = itemsInLocation.length;
                const { className, icon, label } = getOccupancyStyle(itemCount);

                return (
                  <div
                    key={location}
                    onClick={() => itemCount > 0 && onLocationClick(location)}
                    className={`p-2 rounded-md text-center text-xs font-mono border ${className}`}
                  >
                    <p className="font-bold text-sm">{location}</p>
                    <div className="h-5 flex items-center justify-center">
                        {icon}
                    </div>
                    <p className="truncate">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 pt-4 border-t flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-gray-600">
        <h4 className="font-semibold mr-4">Legend:</h4>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200 border"></div><span>Empty</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-200 border"></div><span>Low (1-2)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-200 border"></div><span>Medium (3-5)</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-200 border"></div><span>High (6+)</span></div>
      </div>
    </div>
  );
};
