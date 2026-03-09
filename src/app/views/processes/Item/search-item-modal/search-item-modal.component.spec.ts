import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ItemsService } from '../../../Items/Services/items.service';

import { SearchItemModalComponent } from './search-item-modal.component';

describe('SearchItemModalComponent', () => {
  let component: SearchItemModalComponent;
  let fixture: ComponentFixture<SearchItemModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchItemModalComponent],
      providers: [
        {
          provide: ItemsService,
          useValue: {
            searchItemsByWarehouseForInventory: () =>
              of({
                data: {
                  data: [],
                  pageNumber: 1,
                  pageSize: 20,
                  totalPages: 0,
                  totalRecords: 0,
                  hasNext: false,
                  hasPrevious: false
                }
              }),
            searchItemsByWarehouseForPurchase: () =>
              of({
                data: {
                  data: [],
                  pageNumber: 1,
                  pageSize: 20,
                  totalPages: 0,
                  totalRecords: 0,
                  hasNext: false,
                  hasPrevious: false
                }
              }),
            searchItemsByWarehouseForSales: () =>
              of({
                data: {
                  data: [],
                  pageNumber: 1,
                  pageSize: 20,
                  totalPages: 0,
                  totalRecords: 0,
                  hasNext: false,
                  hasPrevious: false
                }
              })
          }
        },
        {
          provide: ToastrService,
          useValue: {
            error: () => {}
          }
        },
        {
          provide: Router,
          useValue: {
            url: '/processes/transferred-request/add-item/1/1'
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchItemModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
