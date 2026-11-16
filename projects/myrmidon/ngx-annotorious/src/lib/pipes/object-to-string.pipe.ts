import { Pipe, PipeTransform } from '@angular/core';

/**
 * A pipe which transforms the received object into a string using the
 * specified function. Usage: `{{ myObject | objectToString:myFunction }}`.
 */
@Pipe({
  name: 'objectToString',
})
export class ObjectToStringPipe implements PipeTransform {
  public transform<T>(
    value: T,
    fn?: ((value: T) => string | null | undefined) | null
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return fn ? fn(value) ?? null : String(value);
  }
}
