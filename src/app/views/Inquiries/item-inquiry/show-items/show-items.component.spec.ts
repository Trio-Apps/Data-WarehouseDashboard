import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowItemsComponent } from './show-items.component';

describe('ShowItemsComponent', () => {
  let component: ShowItemsComponent;
  let fixture: ComponentFixture<ShowItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowItemsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowItemsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
