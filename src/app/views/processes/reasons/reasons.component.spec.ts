import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { provideRouter } from '@angular/router';
import { ReasonsComponent } from './reasons.component';
import { ReasonService } from './Services/reason.service';
import { AuthService } from '../../pages/Services/auth.service';

describe('ReasonsComponent', () => {
  let component: ReasonsComponent;
  let fixture: ComponentFixture<ReasonsComponent>;

  const reasonServiceMock = {
    getProcessTypes: jasmine.createSpy('getProcessTypes').and.returnValue(of([])),
    getReasonsByProcessType: jasmine.createSpy('getReasonsByProcessType').and.returnValue(of([])),
    addReason: jasmine.createSpy('addReason').and.returnValue(of({})),
    updateReason: jasmine.createSpy('updateReason').and.returnValue(of({})),
    deleteReason: jasmine.createSpy('deleteReason').and.returnValue(of({}))
  };

  const toastrMock = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error')
  };

  const authServiceMock = {
    hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReasonsComponent],
      providers: [
        provideRouter([]),
        { provide: ReasonService, useValue: reasonServiceMock },
        { provide: ToastrService, useValue: toastrMock },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({}))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReasonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
