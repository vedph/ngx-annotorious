import { Injectable } from '@angular/core';

// from https://github.com/knicklabs/lorem-ipsum.js

const WORDS = [
  'ad',
  'adipisicing',
  'aliqua',
  'aliquip',
  'amet',
  'anim',
  'aute',
  'cillum',
  'commodo',
  'consectetur',
  'consequat',
  'culpa',
  'cupidatat',
  'deserunt',
  'do',
  'dolor',
  'dolore',
  'duis',
  'ea',
  'eiusmod',
  'elit',
  'enim',
  'esse',
  'est',
  'et',
  'eu',
  'ex',
  'excepteur',
  'exercitation',
  'fugiat',
  'id',
  'in',
  'incididunt',
  'ipsum',
  'irure',
  'labore',
  'laboris',
  'laborum',
  'Lorem',
  'magna',
  'minim',
  'mollit',
  'nisi',
  'non',
  'nostrud',
  'nulla',
  'occaecat',
  'officia',
  'pariatur',
  'proident',
  'qui',
  'quis',
  'reprehenderit',
  'sint',
  'sit',
  'sunt',
  'tempor',
  'ullamco',
  'ut',
  'velit',
  'veniam',
  'voluptate',
];

export interface LoremIpsumOptions {
  words: string[];
  sentencesPerParagraph: { min: number; max: number };
  wordsPerSentence: { min: number; max: number };
}

export const LOREM_IPSUM_OPTIONS: LoremIpsumOptions = {
  words: WORDS,
  sentencesPerParagraph: { min: 3, max: 7 },
  wordsPerSentence: { min: 5, max: 15 },
};

/**
 * Lorem ipsum text generator, used to generate mock data.
 */
@Injectable({
  providedIn: 'root',
})
export class LoremIpsumService {
  private capitalize(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.substring(1) : s;
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private validateOptions(options: LoremIpsumOptions): void {
    if (options.sentencesPerParagraph.min > options.sentencesPerParagraph.max) {
      throw new Error(
        'Minimum number of sentences per paragraph cannot exceed maximum'
      );
    }
    if (options.wordsPerSentence.min > options.wordsPerSentence.max) {
      throw new Error(
        'Minimum number of words per sentence cannot exceed maximum'
      );
    }
  }

  private getRandomWord(options: LoremIpsumOptions): string {
    return options.words[this.getRandomInt(0, options.words.length - 1)];
  }

  /**
   * Generate the specified number of words.
   * @param count The words count, or undefined for a random count
   * in the range defined by options.wordsPerSentence.
   * @param options The options.
   * @returns The words separated by space.
   */
  public generateWords(
    count?: number,
    options: LoremIpsumOptions = LOREM_IPSUM_OPTIONS
  ): string {
    this.validateOptions(options);
    const { min, max } = options.wordsPerSentence;
    const len = count || this.getRandomInt(min, max);
    return Array.from({ length: len }, () => this.getRandomWord(options)).join(
      ' '
    );
  }

  /**
   * Generate a sentence.
   * @param options The options.
   * @returns The sentence.
   */
  public generateSentence(
    options: LoremIpsumOptions = LOREM_IPSUM_OPTIONS
  ): string {
    return this.capitalize(this.generateWords(undefined, options)) + '.';
  }

  /**
   * Generate a paragraph.
   * @param options The options.
   * @returns The paragraph.
   */
  public generateParagraph(
    options: LoremIpsumOptions = LOREM_IPSUM_OPTIONS
  ): string {
    this.validateOptions(options);
    const { min, max } = options.sentencesPerParagraph;
    const len = this.getRandomInt(min, max);
    return Array.from({ length: len }, () =>
      this.generateSentence(options)
    ).join(' ');
  }
}
