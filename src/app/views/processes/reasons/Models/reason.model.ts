export interface ProcessTypeOption {
  id: number;
  name: string;
}

export interface ReasonDto {
  reasonId: number;
  name: string;
  processType: string | number;
  isActive?: boolean;
}

export interface AddReasonDto {
  name: string;
  processType: string | number;
  isActive: boolean;
}

export interface UpdateReasonDto {
  name: string;
  processType: string | number;
  isActive: boolean;
}
