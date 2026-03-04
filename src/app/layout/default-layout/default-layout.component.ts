import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
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
import { navItems, NavItemWithPermissions } from './_nav';
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
    NgIf,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective
  ]
})
export class DefaultLayoutComponent implements OnInit {
  public navItems: NavItemWithPermissions[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.filterNavItems();
  }

  filterNavItems(): void {
    this.navItems = this.filterItemsByPermissions(navItems);
  }

  private filterItemsByPermissions(items: NavItemWithPermissions[]): NavItemWithPermissions[] {
    return items
      .map((item) => {
        const required = item.permissions;

        if (item.children && item.children.length > 0) {
          const filteredChildren = this.filterItemsByPermissions(item.children);
          const hasParentPermission = this.hasAnyPermission(required);
          if (filteredChildren.length === 0 && !hasParentPermission) {
            return null;
          }
          return {
            ...item,
            children: filteredChildren
          };
        }

        if (!this.hasAnyPermission(required)) {
          return null;
        }

        return item;
      })
      .filter((item): item is NavItemWithPermissions => !!item);
  }

  private hasAnyPermission(permissions?: string[]): boolean {
    if (!permissions || permissions.length === 0) {
      return true;
    }
    return this.authService.hasAnyPermission(permissions);
  }
}
