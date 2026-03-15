import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AttachmentsComponent } from './attachments.component';
import { AttachmentsService } from './Services/attachments.service';

describe('AttachmentsComponent', () => {
  let component: AttachmentsComponent;
  let fixture: ComponentFixture<AttachmentsComponent>;
  const attachmentsServiceMock = {
    getDocuments: jasmine.createSpy('getDocuments').and.returnValue(of({ success: true, data: [] })),
    uploadDocuments: jasmine.createSpy('uploadDocuments').and.returnValue(of({ success: true })),
    downloadDocument: jasmine.createSpy('downloadDocument').and.returnValue(of({ body: null, headers: { get: () => null } })),
    deleteDocument: jasmine.createSpy('deleteDocument').and.returnValue(of({ success: true }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttachmentsComponent],
      providers: [
        {
          provide: AttachmentsService,
          useValue: attachmentsServiceMock
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttachmentsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
