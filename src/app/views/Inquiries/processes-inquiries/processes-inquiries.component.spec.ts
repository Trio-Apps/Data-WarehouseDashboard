import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessesInquiriesComponent } from './processes-inquiries.component';

describe('ProcessesInquiriesComponent', () => {
  let component: ProcessesInquiriesComponent;
  let fixture: ComponentFixture<ProcessesInquiriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcessesInquiriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProcessesInquiriesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
