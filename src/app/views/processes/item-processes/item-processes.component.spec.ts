import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemProcessesComponent } from './item-processes.component';

describe('ItemProcessesComponent', () => {
  let component: ItemProcessesComponent;
  let fixture: ComponentFixture<ItemProcessesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemProcessesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemProcessesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
