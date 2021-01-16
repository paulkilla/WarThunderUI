import { TestBed } from '@angular/core/testing';

import { WarthunderService } from './warthunder.service';

describe('WarthunderService', () => {
  let service: WarthunderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WarthunderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
