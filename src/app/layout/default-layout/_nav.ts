import { INavData } from '@coreui/angular';

export interface NavItemWithPermissions extends INavData {
  permissions?: string[];
  children?: NavItemWithPermissions[];
}

export const navItems: NavItemWithPermissions[] = [
  {
    name: 'Dashboard',
    url: '/inquiries/processes-inquiry',
    //iconComponent: { name: 'cil-speedometer' },
   
    // badge: {
    //   color: 'info',
    //   text: 'NEW'
    // }

  },
  {
    title: true,
    name: 'Theme',
    permissions: ['Companys.Get']
  },

  // {
  //   name: 'Inquiries',
  //   url: '/inquiries',
  //  // //iconComponent: { name: 'cil-drop' },
  //   children: [
  //     {
  //       name: 'Barcodes Inquiry',
  //       url: '/inquiries/items-inquiry',
  //       icon: 'nav-icon-bullet',
  //       permissions: ['Warehouses.Get']
  //     },
  //      {
  //       name: 'Processes Inquiry',
  //       url: '/inquiries/processes-inquiry',
  //       icon: 'nav-icon-bullet',
  //       permissions: ['Warehouses.Get']
  //     }
  //   ]
  // },
  {
    name: 'Companies',
    url: '/companies/companies',
  //  //iconComponent: { name: 'cil-building' },
    permissions: ['Companys.Get']
  },
  {
    name: 'Components',
    title: true,
     permissions: ['Roles.Get','Users.Get']

  },
 {
        name: 'Users Management',
        url: '/users/users',
        icon: 'nav-icon-bullet',
        permissions: ['Users.Get']
      },

        {
        name: 'Roles Management',
        url: '/roles/roles',
        icon: 'nav-icon-bullet',
        permissions: ['Roles.Get']
      }
,

   {
    title: true,
    name: 'Approval'
  }
  ,
    {
        name: 'Approval Steps Management',
        url: '/processes/approval-process/approval-steps',
        icon: 'nav-icon-bullet',
        permissions: ['ApprovalSteps.Get']
      },
      {
        name: 'My Approvals',
        url: '/processes/approval-process/my-processes',
        icon: 'nav-icon-bullet',
        permissions: ['Approvals.GetMy']
      },

 
   {
    title: true,
    name: 'Setting'
  },
   {
        name: 'SAP Auth Settings',
        url: '/settings/auth',
        icon: 'nav-icon-bullet',
        permissions: ['Saps.Get']
      },     
      {
        name: 'SAP Sync Reset',
        url: '/settings/sync-reset',
        icon: 'nav-icon-bullet',
        permissions: ['Saps.Get']
      },
  {
    name: 'Barcode Settings',
        url: '/barcodes/barcodes',
        icon: 'nav-icon-bullet',
    permissions: ['Items.Get']
  },
    // },
  // {
  //   name: 'Production',
  //   url: '/processes/production/menu',
  //   iconComponent: { name: 'cil-industry' },
  //   permissions: ['Productions.Get']
  // },
  // {
  //   name: 'Stock Counting',
  //   url: '/processes/stock-counting/menu',
  //   iconComponent: { name: 'cil-calculator' },
  //   permissions: ['Counting.Get']
  // },

//


//
 
  {
    title: true,
    name: 'Links',
    class: 'mt-auto'
  },
  {
    name: 'Docs',
    url: 'https://coreui.io/angular/docs/',
    //iconComponent: { name: 'cil-description' },
    attributes: { target: '_blank' }
  }
];
