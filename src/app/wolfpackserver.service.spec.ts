import { TestBed } from '@angular/core/testing';

import { WolfpackserverService } from './wolfpackserver.service';

describe('WolfpackserverService', () => {
  let service: WolfpackserverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WolfpackserverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
