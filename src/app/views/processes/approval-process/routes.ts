import { Routes } from '@angular/router';
import { ApprovalProcessComponent } from './approval-process.component';
import { MyProcessesComponent } from './my-processes/my-processes.component';
import { ProcessSettingComponent } from './process-setting/process-setting.component';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Processes'
    },
    children: [
      {
        path: 'approval-steps',
        component: ProcessSettingComponent,
        data: {
          title: 'Approval Process Settings'
        }
      },
      {
        path: 'approval-steps/:id',
        component: ApprovalProcessComponent,
        data: {
          title: 'Approval Steps'
        }
      },
      {
        path: 'my-processes',
        component: MyProcessesComponent,
        data: {
          title: 'My Approvals'
        }
      },
    
    ]
  }
];
