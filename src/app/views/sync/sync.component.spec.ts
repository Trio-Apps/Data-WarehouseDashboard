import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { SyncComponent } from './sync.component';
import { SapSyncResetService } from './Services/sap-sync-reset.service';
import { AuthService } from '../pages/Services/auth.service';

describe('SyncComponent', () => {
  let component: SyncComponent;
  let fixture: ComponentFixture<SyncComponent>;
  let syncServiceSpy: jasmine.SpyObj<SapSyncResetService>;

  beforeEach(async () => {
    syncServiceSpy = jasmine.createSpyObj<SapSyncResetService>('SapSyncResetService', ['getCompanySyncState', 'resetSyncByEntity']);
    syncServiceSpy.getCompanySyncState.and.returnValue(
      of({
        success: true,
        message: '',
        data: [],
        errors: null
      })
    );

    await TestBed.configureTestingModule({
      imports: [SyncComponent],
      providers: [
        { provide: SapSyncResetService, useValue: syncServiceSpy },
        {
          provide: AuthService,
          useValue: {
            hasPermission: () => true
          }
        },
        {
          provide: ToastrService,
          useValue: {
            success: () => void 0,
            error: () => void 0,
            warning: () => void 0,
            info: () => void 0
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SyncComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
