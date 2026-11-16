import { TestBed } from '@angular/core/testing';

import { LOREM_IPSUM_OPTIONS, LoremIpsumService } from './lorem-ipsum.service';

describe('LoremIpsumService', () => {
  let service: LoremIpsumService;

  beforeEach(() => {
    service = TestBed.inject(LoremIpsumService);
  });

  it('should generate the requested number of words', () => {
    const words = service.generateWords(7).split(' ');
    expect(words).toHaveLength(7);
    for (const w of words) {
      expect(LOREM_IPSUM_OPTIONS.words).toContain(w);
    }
  });

  it('should generate a capitalized sentence within the options range', () => {
    const options = {
      ...LOREM_IPSUM_OPTIONS,
      wordsPerSentence: { min: 3, max: 3 },
    };
    const sentence = service.generateSentence(options);
    expect(sentence).toMatch(/^[A-Z].*\.$/);
    expect(sentence.split(' ')).toHaveLength(3);
  });

  it('should generate a paragraph within the options range', () => {
    const options = {
      ...LOREM_IPSUM_OPTIONS,
      sentencesPerParagraph: { min: 2, max: 2 },
    };
    const paragraph = service.generateParagraph(options);
    expect(paragraph.match(/\./g)).toHaveLength(2);
  });

  it('should reject invalid options', () => {
    expect(() =>
      service.generateWords(undefined, {
        ...LOREM_IPSUM_OPTIONS,
        wordsPerSentence: { min: 5, max: 1 },
      })
    ).toThrow();
  });
});
