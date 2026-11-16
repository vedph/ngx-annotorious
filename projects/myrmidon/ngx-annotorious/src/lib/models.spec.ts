import { areAnnotationsEqual, DEFAULT_ANNOTORIOUS_CONFIG } from './models';
import { createTestAnnotation } from './testing/fake-annotator';

describe('models', () => {
  it('DEFAULT_ANNOTORIOUS_CONFIG should be frozen', () => {
    expect(Object.isFrozen(DEFAULT_ANNOTORIOUS_CONFIG)).toBe(true);
  });

  describe('areAnnotationsEqual', () => {
    it('should treat same reference and both empty as equal', () => {
      const a = [createTestAnnotation('a')];
      expect(areAnnotationsEqual(a, a)).toBe(true);
      expect(areAnnotationsEqual([], [])).toBe(true);
    });

    it('should treat null vs array as different', () => {
      expect(areAnnotationsEqual(null, [])).toBe(false);
      expect(areAnnotationsEqual([], undefined)).toBe(false);
    });

    it('should compare by value', () => {
      expect(
        areAnnotationsEqual(
          [createTestAnnotation('a', 'x')],
          [createTestAnnotation('a', 'x')]
        )
      ).toBe(true);
      expect(
        areAnnotationsEqual(
          [createTestAnnotation('a', 'x', 1)],
          [createTestAnnotation('a', 'x', 2)]
        )
      ).toBe(false);
    });
  });
});
