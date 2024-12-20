import { Pipe, PipeTransform } from '@angular/core';

/**
 * A pipe which transforms the received object into a string
 * using the specified function to build that string from the
 * object.
 * Usage: {{ myObject | objectToString:myFunction }}
 */
@Pipe({
  name: 'objectToString',
})
export class ObjectToStringPipe implements PipeTransform {
  transform(value: any, fn: Function): string | null {
    return fn(value);
  }
}
