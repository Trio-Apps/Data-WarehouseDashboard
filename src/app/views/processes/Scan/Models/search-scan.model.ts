export interface SearchScanDocument {
  documentType: string;
  entityName: string;
  id: number;
  docNum: number;
  docEntry: number;
  status: string;
  createdAt: string;
  postingDate: string;
  dueDate: string;
  comment: string;
  errorMessage: string;
}

export interface SearchScanPagedResponse {
  data: SearchScanDocument[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface SearchScanEnvelopeResponse {
  data: SearchScanPagedResponse;
}

export type SearchScanApiResponse = SearchScanPagedResponse | SearchScanEnvelopeResponse;
