export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: any;
}

export interface SapSyncState {
  sapId: number;
  entityName: string;
  lastSyncDate: string | null;
  skip: number | null;
}

export type SapSyncEntityKey =
  | 'item'
  | 'warehouse'
  | 'purchase'
  | 'count'
  | 'businessPartners'
  | 'itemUomGroup'
  | 'sales';

export type SapSyncStateResponse = ApiResponse<SapSyncState[]>;
export type SapSyncResetResponse = ApiResponse<boolean>;
