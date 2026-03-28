import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SearchScanComponent } from './search-scan.component';
import { SearchScanService } from '../Services/search-scan.service';

describe('SearchScanComponent', () => {
  let component: SearchScanComponent;
  let fixture: ComponentFixture<SearchScanComponent>;
  let searchScanServiceMock: jasmine.SpyObj<SearchScanService>;

  beforeEach(async () => {
    searchScanServiceMock = jasmine.createSpyObj<SearchScanService>('SearchScanService', ['searchDocuments']);
    searchScanServiceMock.searchDocuments.and.returnValue(
      of({
        data: [],
        pageNumber: 1,
        pageSize: 20,
        totalRecords: 0,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false
      })
    );

    await TestBed.configureTestingModule({
      imports: [SearchScanComponent],
      providers: [provideRouter([]), { provide: SearchScanService, useValue: searchScanServiceMock }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchScanComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

