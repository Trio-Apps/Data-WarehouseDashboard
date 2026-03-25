export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface PagedResult<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export interface AppNotification {
  notificationId: number;
  title: string;
  message: string;
  actionType: string;
  documentType: string;
  processType?: string | null;
  referenceId?: number | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}
