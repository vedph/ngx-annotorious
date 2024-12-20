import { ObjectToStringPipe } from './object-to-string.pipe';

describe('ObjectToStringPipe', () => {
  it('create an instance', () => {
    const pipe = new ObjectToStringPipe();
    expect(pipe).toBeTruthy();
  });
});
