import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceivedModalComponent } from './received-modal.component';

describe('ReceivedModalComponent', () => {
  let component: ReceivedModalComponent;
  let fixture: ComponentFixture<ReceivedModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceivedModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceivedModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
