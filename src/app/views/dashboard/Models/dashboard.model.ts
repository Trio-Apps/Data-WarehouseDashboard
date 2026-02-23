export interface DashboardHomeInfo {
  userName?: string;
  databaseName?: string;
  lastSyncAt?: string | null;
}

export interface DashboardSyncResponse {
  lastSyncAt?: string | null;
  message?: string;
}
