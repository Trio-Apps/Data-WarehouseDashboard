import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchSupplierModalComponent } from './search-supplier-modal.component';

describe('SearchSupplierModalComponent', () => {
  let component: SearchSupplierModalComponent;
  let fixture: ComponentFixture<SearchSupplierModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchSupplierModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchSupplierModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
