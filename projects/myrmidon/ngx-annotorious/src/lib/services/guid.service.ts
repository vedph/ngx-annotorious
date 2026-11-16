import { Injectable } from '@angular/core';

/**
 * Get a new random GUID (UUID v4).
 * @returns The GUID.
 */
export function newGuid(): string {
  const c: Partial<Crypto> | undefined =
    typeof crypto !== 'undefined' ? crypto : undefined;
  if (typeof c?.randomUUID === 'function') {
    return c.randomUUID();
  }
  // fallback for non-secure contexts, where randomUUID is not available
  const bytes = new Uint8Array(16);
  if (typeof c?.getRandomValues === 'function') {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

/**
 * GUID generator service.
 */
@Injectable({
  providedIn: 'root',
})
export class GuidService {
  /**
   * Get a new random GUID (UUID v4).
   * @returns A new GUID.
   */
  public getGuid(): string {
    return newGuid();
  }
}
