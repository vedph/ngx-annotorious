import { ObjectToStringPipe } from './object-to-string.pipe';

describe('ObjectToStringPipe', () => {
  const pipe = new ObjectToStringPipe();

  it('should return null for null or undefined', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
  });

  it('should use the function when provided', () => {
    expect(pipe.transform({ a: 1 }, (o) => `a=${o.a}`)).toBe('a=1');
  });

  it('should return null when the function returns undefined', () => {
    expect(pipe.transform({ a: 1 }, () => undefined)).toBeNull();
  });

  it('should stringify when no function is provided', () => {
    expect(pipe.transform(42)).toBe('42');
  });
});
