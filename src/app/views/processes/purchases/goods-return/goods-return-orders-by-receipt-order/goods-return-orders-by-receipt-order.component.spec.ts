import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoodsReturnOrdersByReceiptOrderComponent } from './goods-return-orders-by-receipt-order.component';

describe('GoodsReturnOrdersByReceiptOrderComponent', () => {
  let component: GoodsReturnOrdersByReceiptOrderComponent;
  let fixture: ComponentFixture<GoodsReturnOrdersByReceiptOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoodsReturnOrdersByReceiptOrderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoodsReturnOrdersByReceiptOrderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
