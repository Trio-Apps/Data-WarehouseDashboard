import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';

import { IconDirective } from '@coreui/icons-angular';
import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective,
  INavData
} from '@coreui/angular';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems } from './_nav';
import { AuthService } from '../../views/pages/Services/auth.service';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  imports: [
    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    ContainerComponent,
    DefaultFooterComponent,
    DefaultHeaderComponent,
    IconDirective,
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective
  ]
})
export class DefaultLayoutComponent implements OnInit {
  public navItems: INavData[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.filterNavItems();
  }

  filterNavItems(): void {
    const isSuperAdmin = this.authService.hasRole('super-admin');
    const isAdmin = this.authService.hasRole('admin');
 const isManager = this.authService.hasRole('manager');

    if (isSuperAdmin) {
      // Show all items if user is admin
      this.navItems = navItems.filter(item => {
        // Filter out Barcodes
        if (item.name === 'Barcodes') {
          return false;
        }
          // Filter out Barcodes
        if (item.name === 'Inquiries') {
          return false;
        }
       
           // Filter out Barcodes
        if (item.name === 'Settings') {
          return false;
        }
        
        return true;
      });
    } else if(isAdmin) {
      // Filter out Settings and Barcodes if user is not admin
      this.navItems = navItems.filter(item => {
        
           // Filter out Barcodes
        if (item.name === 'Companies') {
          return false;
        }
        return true;
      });
    }
    else {
        this.navItems = navItems.filter(item => {
           // Filter out Barcodes
        if (item.name === 'Roles' || item.name === 'Settings' || item.name === 'Companies') {
          return false;
        }
        return true;
      });
    }
  }
}
