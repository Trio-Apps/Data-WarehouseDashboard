import { INavData } from '@coreui/angular';

export interface NavItemWithPermissions extends INavData {
  permissions?: string[];
  children?: NavItemWithPermissions[];
  translationKey?: string;
}

export const navItems: NavItemWithPermissions[] = [
  {
    name: 'Dashboard',
    translationKey: 'nav.dashboard',
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
    translationKey: 'nav.theme',
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
    translationKey: 'nav.companies',
    url: '/companies/companies',
  //  //iconComponent: { name: 'cil-building' },
    permissions: ['Companys.Get']
  },
  {
    name: 'Components',
    title: true,
    translationKey: 'nav.components',
     permissions: ['Roles.Get','Users.Get']

  },
 {
        name: 'Users Management',
        translationKey: 'nav.usersManagement',
        url: '/users/users',
        icon: 'nav-icon-bullet',
        permissions: ['Users.Get']
      },

        {
        name: 'Roles Management',
        translationKey: 'nav.rolesManagement',
        url: '/roles/roles',
        icon: 'nav-icon-bullet',
        permissions: ['Roles.Get']
      }
,

   {
    title: true,
    name: 'Approval',
    translationKey: 'nav.approval'
  }
  ,
    {
        name: 'Approval Steps Management',
        translationKey: 'nav.approvalStepsManagement',
        url: '/processes/approval-process/approval-steps',
        icon: 'nav-icon-bullet',
        permissions: ['ApprovalSteps.Get']
      },
      {
        name: 'My Approvals',
        translationKey: 'nav.myApprovals',
        url: '/processes/approval-process/my-processes',
        icon: 'nav-icon-bullet',
        permissions: ['Approvals.GetMy']
      },

 
   {
    title: true,
    name: 'Setting',
    translationKey: 'nav.setting'
  },
   {
        name: 'SAP Auth Settings',
        translationKey: 'nav.sapAuthSettings',
        url: '/settings/auth',
        icon: 'nav-icon-bullet',
        permissions: ['Saps.Get']
      },
      {
        name: 'Language',
        translationKey: 'nav.language',
        url: '/settings/language',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'SAP Sync Reset',
        translationKey: 'nav.sapSyncReset',
        url: '/settings/sync-reset',
        icon: 'nav-icon-bullet',
        permissions: ['Saps.Get']
      },
  {
    name: 'Barcode Settings',
    translationKey: 'nav.barcodeSettings',
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


];
