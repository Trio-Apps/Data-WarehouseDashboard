import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferredReceivedStockComponent } from './transferred-received-stock.component';

describe('TransferredReceivedStockComponent', () => {
  let component: TransferredReceivedStockComponent;
  let fixture: ComponentFixture<TransferredReceivedStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransferredReceivedStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransferredReceivedStockComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
