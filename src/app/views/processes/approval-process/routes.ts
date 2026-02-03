import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Processes'
    },
    children: [
      {
        path: 'approval-steps',
        loadComponent: () => import('./approval-process.component').then(m => m.ApprovalProcessComponent),
        data: {
          title: 'Approval Steps'
        }
      },
      {
        path: 'my-processes',
        loadComponent: () => import('./my-processes/my-processes.component').then(m => m.MyProcessesComponent),
        data: {
          title: 'My Approvals'
        }
      },
    
    ]
  }
];
