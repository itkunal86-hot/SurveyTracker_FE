export interface ValveOperation {
  id: string;
  catastropheId: string;
  valveId: string;
  actionType: 'open' | 'close';
  actionTimestamp: Date;
  performedBy: string;
  remarks?: string;
}

export interface Valve {
  id: string;
  name: string;
  segmentId: string;
  currentStatus: 'open' | 'closed';
  lastOperation?: Date;
}

export interface Catastrophe {
  id: string;
  description: string;
}

export interface ValveOperationFilters {
  catastropheId: string;
  valveId: string;
  actionType: string;
}