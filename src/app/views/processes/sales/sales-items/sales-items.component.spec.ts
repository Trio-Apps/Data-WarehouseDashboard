import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesItemsComponent } from './sales-items.component';

describe('SalesItemsComponent', () => {
  let component: SalesItemsComponent;
  let fixture: ComponentFixture<SalesItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesItemsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesItemsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
