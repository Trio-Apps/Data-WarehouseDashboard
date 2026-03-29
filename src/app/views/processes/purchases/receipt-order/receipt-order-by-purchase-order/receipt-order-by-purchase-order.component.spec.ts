import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptOrderByPurchaseOrderComponent } from './receipt-order-by-purchase-order.component';

describe('ReceiptOrderByPurchaseOrderComponent', () => {
  let component: ReceiptOrderByPurchaseOrderComponent;
  let fixture: ComponentFixture<ReceiptOrderByPurchaseOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptOrderByPurchaseOrderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptOrderByPurchaseOrderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
