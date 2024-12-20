import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GuidService {
  /**
   * Gets a new GUID.
   * @returns A new GUID.
   */
  public getGuid(): string {
    function s4(): string {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      '-' +
      s4() +
      '-' +
      s4() +
      '-' +
      s4() +
      '-' +
      s4() +
      s4() +
      s4()
    );
  }


}
