import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
    badge: {
      color: 'info',
      text: 'NEW'
    }
  },
  {
    title: true,
    name: 'Theme'
  },
  {
    name: 'Inquiries',
    url: '/inquiries',
    iconComponent: { name: 'cil-drop' },
    children: [
      {
        name: 'Barcodes Inquiry',
        url: '/inquiries/items-inquiry',
        icon: 'nav-icon-bullet'
      },
       {
        name: 'Processes Inquiry',
        url: '/inquiries/processes-inquiry',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    name: 'Companies',
    url: '/companies/companies',
    iconComponent: { name: 'cil-building' }
  },

  {
    name: 'Components',
    title: true
  },

  {
    name: 'Users',
    url: '/users',
    iconComponent: { name: 'cil-people' },
    children: [
      {
        name: 'Users Management',
        url: '/users/users',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    name: 'Roles',
    url: '/roles',
    iconComponent: { name: 'cil-arrow-top' },
    children: [
      {
        name: 'Roles Management',
        url: '/roles/roles',
        icon: 'nav-icon-bullet'
      }
    ]
  },
   {
    name: 'Approval Process',
    url: '/approval-process',
    iconComponent: { name: 'cil-arrow-top' },
    children: [
      {
        name: 'Approval Steps Management',
        url: '/processes/approval-process/approval-steps',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'My Approvals',
        url: '/processes/approval-process/my-processes',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    name: 'Settings',
    url: '/settings',
    iconComponent: { name: 'cil-settings' },
    children: [
      {
        name: 'SAP Auth Settings',
        url: '/settings/auth',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    name: 'Barcodes',
    url: '/barcodes',
    iconComponent: { name: 'cil-barcode' },
    children: [
      {
        name: 'Barcode Settings',
        url: '/barcodes/barcodes',
        icon: 'nav-icon-bullet'
      }
    ]
  },

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
    iconComponent: { name: 'cil-description' },
    attributes: { target: '_blank' }
  }
];
