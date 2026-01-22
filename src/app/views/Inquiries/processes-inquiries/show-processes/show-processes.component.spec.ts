import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowProcessesComponent } from './show-processes.component';

describe('ShowProcessesComponent', () => {
  let component: ShowProcessesComponent;
  let fixture: ComponentFixture<ShowProcessesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowProcessesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowProcessesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
