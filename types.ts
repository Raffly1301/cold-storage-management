
export interface StockItem {
  id: string;
  itemCode: string;
  pcs: number;
  kgs: number;
  productionDate: string;
  expiryDate: string;
  location: string;
  entryDate: string;
  status: 'AVAILABLE' | 'HOLD';
  holdReason?: string;
}

export enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
  SHIFT = 'SHIFT',
  STATUS_CHANGE = 'STATUS_CHANGE',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  item: StockItem;
  timestamp: string;
  fromLocation?: string;
  toLocation?: string;
  username: string;
  notes?: string;
}

export interface User {
  username: string;
  password?: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
}

export interface PendingRequest {
  id: string;
  type: 'IN' | 'OUT';
  data: any; // Stores StockItem[] for IN, or { stockId, pcs, kgs }[] for OUT
  requester: string;
  timestamp: string;
  status: 'PENDING';
}
