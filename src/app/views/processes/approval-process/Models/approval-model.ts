export interface AddApprovalStepDto {
  stepName: string;
  stepOrder: number;
  roleId: string;
  processSettingApprovalId: number;
}

export interface UpdateApprovalStepDto {
  approvalStepId: number;
  stepName?: string | null;
  stepOrder?: number | null;
  roleId?: string | null;
}

export interface ApprovalStepDto {
  approvalStepId: number;
  stepName: string;
  stepOrder: number;
  roleId: string;
  roleName: string;
  isActive: boolean;
  isFinalStep: boolean;
  companyId: number;
}

export interface ApprovalStepResponse {
  success: boolean;
  message: string;
  data: {
    data: ApprovalStepDto[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}

export interface ProcessSettingApprovalDto {
  processSettingApprovalId: number;
  processType: string;
  ignoreSteps: boolean;
  companyId: number;
  approvalSteps?: ApprovalStepDto[];
}

export interface ProcessItemIsProgress {
  processItemIsProgressId: number;
  processType: string;
  referenceId: number;
  createdDate?: string;
  completedDate?: string | null;
  status?: string;
}

export interface ProcessApproval {
  processApprovalId: number;
  status: string;
  comment?: string | null;
  actionDate?: string | null;
  createdDate?: string;
  approvalStepId?: number;
  approvalStep?: ApprovalStepDto | null;
  userId?: string | null;
  warehouseId?: number | null;
  processItemIsProgressId?: number;
  processItemIsProgress?: ProcessItemIsProgress | null;
}

export interface ProcessApprovalResponse {
  success: boolean;
  message: string;
  data: {
    data: ProcessApproval[];
    hasNext: boolean;
    hasPrevious: boolean;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalRecords: number;
  };
  errors: any;
}


