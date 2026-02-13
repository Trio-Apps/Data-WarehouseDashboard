import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGoodsReturnItemComponent } from './add-goods-return-item.component';

describe('AddGoodsReturnItemComponent', () => {
  let component: AddGoodsReturnItemComponent;
  let fixture: ComponentFixture<AddGoodsReturnItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddGoodsReturnItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddGoodsReturnItemComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
