import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferredStockOrdersByTransferredRequestComponent } from './transferred-stock-orders-by-transferred-request.component';

describe('TransferredStockOrdersByTransferredRequestComponent', () => {
  let component: TransferredStockOrdersByTransferredRequestComponent;
  let fixture: ComponentFixture<TransferredStockOrdersByTransferredRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferredStockOrdersByTransferredRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferredStockOrdersByTransferredRequestComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
