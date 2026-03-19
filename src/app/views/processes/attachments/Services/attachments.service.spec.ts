import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AttachmentsService } from './attachments.service';
import { AuthService } from '../../../pages/Services/auth.service';

describe('AttachmentsService', () => {
  let service: AttachmentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getToken: () => 'test-token',
          },
        },
      ],
    });
    service = TestBed.inject(AttachmentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
