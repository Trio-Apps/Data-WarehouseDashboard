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
    }
  ]
}



];



