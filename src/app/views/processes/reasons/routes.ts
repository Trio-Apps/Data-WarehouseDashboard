import { Routes } from '@angular/router';
import { ReasonsComponent } from './reasons.component';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Reasons'
    },
    children: [
      {
        path: '',
        component: ReasonsComponent,
        data: {
          title: 'Reasons Process Types'
        }
      },
      {
        path: ':processType',
        component: ReasonsComponent,
        data: {
          title: 'Reasons Details'
        }
      }
    ]
  }
];
