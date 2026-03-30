import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesReturnOrdersByDeliveryNoteComponent } from './sales-return-orders-by-delivery-note.component';

describe('SalesReturnOrdersByDeliveryNoteComponent', () => {
  let component: SalesReturnOrdersByDeliveryNoteComponent;
  let fixture: ComponentFixture<SalesReturnOrdersByDeliveryNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesReturnOrdersByDeliveryNoteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesReturnOrdersByDeliveryNoteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
