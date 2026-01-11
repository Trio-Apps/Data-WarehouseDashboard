import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemInquiryComponent } from './item-inquiry.component';

describe('ItemInquiryComponent', () => {
  let component: ItemInquiryComponent;
  let fixture: ComponentFixture<ItemInquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemInquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemInquiryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
