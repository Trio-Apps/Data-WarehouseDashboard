import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SearchCustomerModalComponent } from './search-customer-modal.component';
import { SalesService } from '../Services/sales.service';
import { ToastrService } from 'ngx-toastr';

describe('SearchCustomerModalComponent', () => {
  let component: SearchCustomerModalComponent;
  let fixture: ComponentFixture<SearchCustomerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchCustomerModalComponent],
      providers: [
        {
          provide: SalesService,
          useValue: {
            getCustomersPaged: () => of({ data: { data: [] } })
          }
        },
        {
          provide: ToastrService,
          useValue: {
            error: jasmine.createSpy('error')
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchCustomerModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
