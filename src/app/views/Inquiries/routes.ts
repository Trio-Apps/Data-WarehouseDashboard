import { Routes } from '@angular/router';

export const routes: Routes = [
 
{
  path: '',
  data: {
      title: 'Inquiry'
    },
  children: [
    {
      path: '',
      redirectTo: 'items-inquiry',
      pathMatch: 'full'

    },
    {
      path: 'items-inquiry',
      loadComponent: () => import('./item-inquiry/item-inquiry.component')
        .then(m => m.ItemInquiryComponent), data: {
          title: 'Items-Inquiry'
        },
    },
    {
      path: 'show-items/:warehouseId',
      loadComponent: () => import('./item-inquiry/show-items/show-items.component')
        .then(m => m.ShowItemsComponent), data: {
          title: 'Items-Inquiry'
        },
    }
    ,
    {
      path: 'processes-inquiry',
      loadComponent: () => import('./processes-inquiries/processes-inquiries.component')
        .then(m => m.ProcessesInquiriesComponent), data: {
          title: 'Processes-Inquiry'
        },
    },
    {
      path: 'show-processes/:warehouseId',
      loadComponent: () => import('./processes-inquiries/show-processes/show-processes.component')
        .then(m => m.ShowProcessesComponent), data: {
          title: 'Processes-Inquiry'
        },
    },
    {
      path: 'show-reports/:warehouseId',
      loadComponent: () => import('./reports/show-reports/show-reports.component')
        .then(m => m.ShowReportsComponent), data: {
          title: 'Reports'
        },
    },
    {
      path: 'show-transaction-report/:warehouseId',
      loadComponent: () => import('./reports/transaction-report/transaction-report.component')
        .then(m => m.TransactionReportComponent), data: {
          title: 'Transaction Report'
        },
    },
    {
      path: 'show-in-warehouse-report/:warehouseId',
      loadComponent: () => import('./reports/in-warehouse-report/in-warehouse-report.component')
        .then(m => m.InWarehouseReportComponent), data: {
          title: 'In-Warehouse Report'
        },
    }
  ]
}



];


