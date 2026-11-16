import { TestBed } from '@angular/core/testing';

import { GuidService, newGuid } from './guid.service';

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('GuidService', () => {
  it('should generate a v4 UUID', () => {
    const service = TestBed.inject(GuidService);
    expect(service.getGuid()).toMatch(UUID_V4);
  });

  it('should generate unique values', () => {
    const set = new Set(Array.from({ length: 100 }, () => newGuid()));
    expect(set.size).toBe(100);
  });
});
