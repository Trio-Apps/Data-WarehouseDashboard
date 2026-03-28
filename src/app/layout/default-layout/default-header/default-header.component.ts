import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, input, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import { Subscription, catchError, finalize, interval, map, of } from 'rxjs';

import {
  BreadcrumbRouterComponent,
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownHeaderDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  HeaderComponent,
  HeaderNavComponent,
  HeaderTogglerDirective,
  NavItemComponent,
  NavLinkDirective,
  SidebarToggleDirective
} from '@coreui/angular';
import { AuthService } from 'src/app/views/pages/Services/auth.service';
import { SapAuthService } from 'src/app/views/settings/Auth/Services/sap-auth.service';
import { Sap } from 'src/app/views/settings/Auth/Models/sap';
import { AppLanguage, TranslationService } from 'src/app/core/i18n/translation.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { NotificationService } from 'src/app/core/notifications/notification.service';
import { AppNotification } from 'src/app/core/notifications/notification.model';


@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
  styleUrl: './default-header.component.scss',
  standalone: true,
  imports: [ContainerComponent, HeaderTogglerDirective, SidebarToggleDirective, IconDirective, HeaderNavComponent,
     NavItemComponent, NavLinkDirective, RouterLink, RouterLinkActive,
     NgTemplateOutlet, BreadcrumbRouterComponent, DropdownComponent, DropdownToggleDirective,
      DropdownMenuDirective, DropdownHeaderDirective, DropdownItemDirective, DropdownDividerDirective, TranslatePipe]
})
export class DefaultHeaderComponent extends HeaderComponent implements OnInit, OnDestroy {

  readonly #colorModeService = inject(ColorModeService);
  readonly translationService = inject(TranslationService);
  readonly notificationService = inject(NotificationService);
  readonly colorMode = this.#colorModeService.colorMode;
  readonly currentLanguage = this.translationService.currentLanguage;
  readonly languages: { code: AppLanguage; title: string; subtitle: string }[] = [
    { code: 'en', title: 'English', subtitle: 'English' },
    { code: 'ar', title: 'Arabic', subtitle: 'العربية' }
  ];

  //  readonly authService = inject(AuthService);

  readonly colorModes = [
    { name: 'light', text: 'Light', icon: 'cilSun' },
    { name: 'dark', text: 'Dark', icon: 'cilMoon' },
    { name: 'auto', text: 'Auto', icon: 'cilContrast' }
  ];
  SapsList: Sap [] = [];
  loadingSaps: boolean = false;
  sapsLoaded: boolean = false;
  notifications: AppNotification[] = [];
  loadingNotifications: boolean = false;
  notificationsLoaded: boolean = false;
  unreadNotifications: number = 0;
  private readonly notificationPageSize = 10;
  private readonly notificationRefreshMs = 15000;
  private notificationRefreshSubscription?: Subscription;
  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
  });

  constructor(private authService: AuthService,private sapAuthService: SapAuthService, private cdr: ChangeDetectorRef  ) {
    super();
  }

  ngOnInit(): void {
    this.refreshUnreadCount();
    this.notificationRefreshSubscription = interval(this.notificationRefreshMs).subscribe(() => {
      this.refreshUnreadCount();
    });
  }

  ngOnDestroy(): void {
    this.notificationRefreshSubscription?.unsubscribe();
  }


  checkRole(role: string): boolean {
    return this.authService.hasRole(role);
  }
  
  sidebarId = input('sidebar1');

  public newMessages = [
    {
      id: 0,
      from: 'Jessica Williams',
      avatar: '7.jpg',
      status: 'success',
      title: 'Urgent: System Maintenance Tonight',
      time: 'Just now',
      link: 'apps/email/inbox/message',
      message: 'Attention team, we\'ll be conducting critical system maintenance tonight from 10 PM to 2 AM. Plan accordingly...'
    },
    {
      id: 1,
      from: 'Richard Johnson',
      avatar: '6.jpg',
      status: 'warning',
      title: 'Project Update: Milestone Achieved',
      time: '5 minutes ago',
      link: 'apps/email/inbox/message',
      message: 'Kudos on hitting sales targets last quarter! Let\'s keep the momentum. New goals, new victories ahead...'
    },
    {
      id: 2,
      from: 'Angela Rodriguez',
      avatar: '5.jpg',
      status: 'danger',
      title: 'Social Media Campaign Launch',
      time: '1:52 PM',
      link: 'apps/email/inbox/message',
      message: 'Exciting news! Our new social media campaign goes live tomorrow. Brace yourselves for engagement...'
    },
    {
      id: 3,
      from: 'Jane Lewis',
      avatar: '4.jpg',
      status: 'info',
      title: 'Inventory Checkpoint',
      time: '4:03 AM',
      link: 'apps/email/inbox/message',
      message: 'Team, it\'s time for our monthly inventory check. Accurate counts ensure smooth operations. Let\'s nail it...'
    },
    {
      id: 4,
      from: 'Ryan Miller',
      avatar: '3.jpg',
      status: 'info',
      title: 'Customer Feedback Results',
      time: '3 days ago',
      link: 'apps/email/inbox/message',
      message: 'Our latest customer feedback is in. Let\'s analyze and discuss improvements for an even better service...'
    }
  ];

  public newNotifications = [
    { id: 0, title: 'New user registered', icon: 'cilUserFollow', color: 'success' },
    { id: 1, title: 'User deleted', icon: 'cilUserUnfollow', color: 'danger' },
    { id: 2, title: 'Sales report is ready', icon: 'cilChartPie', color: 'info' },
    { id: 3, title: 'New client', icon: 'cilBasket', color: 'primary' },
    { id: 4, title: 'Server overloaded', icon: 'cilSpeedometer', color: 'warning' }
  ];

  public newStatus = [
    { id: 0, title: 'CPU Usage', value: 25, color: 'info', details: '348 Processes. 1/4 Cores.' },
    { id: 1, title: 'Memory Usage', value: 70, color: 'warning', details: '11444GB/16384MB' },
    { id: 2, title: 'SSD 1 Usage', value: 90, color: 'danger', details: '243GB/256GB' }
  ];

  public newTasks = [
    { id: 0, title: 'Upgrade NPM', value: 0, color: 'info' },
    { id: 1, title: 'ReactJS Version', value: 25, color: 'danger' },
    { id: 2, title: 'VueJS Version', value: 50, color: 'warning' },
    { id: 3, title: 'Add new layouts', value: 75, color: 'info' },
    { id: 4, title: 'Angular Version', value: 100, color: 'success' }
  ];

    logout(): void {
    this.authService.logOut();
  }
  // with SAP Auth Service
  getAllSapsObserve(): void {
    if (this.loadingSaps) {
      return;
    }

    this.loadingSaps = true;
    this.cdr.detectChanges();

    this.sapAuthService
      .getAllSap()
      .pipe(
        map((response: any) => this.normalizeSapsResponse(response)),
        catchError((error) => {
          console.error('Error fetching SAP Auth Settings:', error);
          return of([] as Sap[]);
        }),
        finalize(() => {
          this.loadingSaps = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe((saps: Sap[]) => {
        this.SapsList = saps;
        this.sapsLoaded = true;
        this.cdr.detectChanges();
      });
  }

  private normalizeSapsResponse(response: any): Sap[] {
    if (Array.isArray(response)) {
      return response as Sap[];
    }

    const data = response?.data;
    if (Array.isArray(data)) {
      return data as Sap[];
    }
    if (data && typeof data === 'object') {
      return [data as Sap];
    }

    return [];
  }

  selectSapObserve (sapId: number): void {
   
    this.sapAuthService.selectSapWithAdmin(sapId).subscribe({
      next: (response: any) => {
        console.log('Select SAP Response:', response);
        window.location.reload();

        
      },
      error: (error) => {
        console.error('Error select sap:', error);
      }
    });
  }


  onSapsDropdownClick(): void {
   
      this.getAllSapsObserve();
    
  }

  onNotificationsDropdownClick(): void {
    this.refreshUnreadCount();
    this.loadNotifications();
  }

  loadNotifications(): void {
    if (this.loadingNotifications) {
      return;
    }

    this.loadingNotifications = true;
    this.cdr.detectChanges();

    this.notificationService
      .getMyNotifications(1, this.notificationPageSize)
      .pipe(
        catchError((error) => {
          console.error('Error fetching notifications:', error);
          return of(null);
        }),
        finalize(() => {
          this.loadingNotifications = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe((response) => {
        this.notifications = response?.data?.data ?? [];
        this.notificationsLoaded = true;
        this.cdr.detectChanges();
      });
  }

  refreshUnreadCount(): void {
    this.notificationService
      .getUnreadCount()
      .pipe(
        catchError((error) => {
          console.error('Error fetching unread notifications count:', error);
          return of(null);
        })
      )
      .subscribe((response) => {
        this.unreadNotifications = response?.data ?? 0;
        this.cdr.detectChanges();
      });
  }

  markNotificationAsRead(notification: AppNotification): void {
    if (notification.isRead) {
      return;
    }

    this.notificationService.markAsRead(notification.notificationId).subscribe({
      next: () => {
        notification.isRead = true;
        this.unreadNotifications = Math.max(0, this.unreadNotifications - 1);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllNotificationsAsRead(): void {
    if (this.unreadNotifications === 0) {
      return;
    }

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((notification) => ({
          ...notification,
          isRead: true
        }));
        this.unreadNotifications = 0;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  async switchLanguage(language: AppLanguage): Promise<void> {
    await this.translationService.setLanguage(language);
  }


}

