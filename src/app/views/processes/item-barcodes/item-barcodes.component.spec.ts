import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemBarcodesComponent } from './item-barcodes.component';

describe('ItemBarcodesComponent', () => {
  let component: ItemBarcodesComponent;
  let fixture: ComponentFixture<ItemBarcodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemBarcodesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemBarcodesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
