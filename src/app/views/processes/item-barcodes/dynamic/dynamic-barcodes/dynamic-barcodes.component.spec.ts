import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicBarcodesComponent } from './dynamic-barcodes.component';

describe('DynamicBarcodesComponent', () => {
  let component: DynamicBarcodesComponent;
  let fixture: ComponentFixture<DynamicBarcodesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicBarcodesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicBarcodesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
