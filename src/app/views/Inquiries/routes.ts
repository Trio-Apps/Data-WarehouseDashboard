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
  ]
}

];



