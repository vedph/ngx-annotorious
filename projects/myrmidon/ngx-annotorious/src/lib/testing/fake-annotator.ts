import { Subject } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import type { ImageAnnotation } from '@annotorious/annotorious';

import type { ListAnnotator } from '../components/img-annotation-list/img-annotation-list';

// Test helpers (not part of the public API).

/**
 * Create an image annotation with a rectangle selector.
 */
export function createTestAnnotation(
  id: string,
  text?: string,
  x = 10
): ImageAnnotation {
  return {
    id,
    bodies: text
      ? [
          {
            id: `${id}-b`,
            annotation: id,
            type: 'TextualBody',
            purpose: 'commenting',
            value: text,
          },
        ]
      : [],
    target: {
      annotation: id,
      selector: {
        type: 'RECTANGLE' as any,
        geometry: {
          bounds: { minX: x, minY: 10, maxX: x + 10, maxY: 20 },
          x,
          y: 10,
          w: 10,
          h: 10,
        } as any,
      },
    },
  };
}

/**
 * A minimal in-memory fake of the Annotorious annotator API.
 */
export class FakeAnnotator implements ListAnnotator {
  public annotations = new Map<string, ImageAnnotation>();
  public selected: string[] = [];
  private readonly _handlers = new Map<string, Set<(...args: any[]) => void>>();

  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event)!.add(callback);
  }

  public off(event: string, callback: (...args: any[]) => void): void {
    this._handlers.get(event)?.delete(callback);
  }

  public handlerCount(event: string): number {
    return this._handlers.get(event)?.size || 0;
  }

  /**
   * Simulate an event fired by Annotorious.
   */
  public emit(event: string, ...args: any[]): void {
    for (const h of [...(this._handlers.get(event) || [])]) {
      h(...args);
    }
  }

  /**
   * Simulate the user drawing a new shape.
   */
  public draw(annotation: ImageAnnotation): void {
    this.annotations.set(annotation.id, annotation);
    this.emit('createAnnotation', annotation);
  }

  public setAnnotations(
    annotations: Partial<ImageAnnotation>[],
    replace = true
  ): void {
    if (replace) {
      this.annotations.clear();
    }
    for (const a of annotations) {
      this.annotations.set(a.id!, a as ImageAnnotation);
    }
  }

  public clearAnnotations(): void {
    this.annotations.clear();
  }

  public removeAnnotation(
    arg: Partial<ImageAnnotation> | string
  ): ImageAnnotation | undefined {
    const id = typeof arg === 'string' ? arg : arg.id!;
    const a = this.annotations.get(id);
    this.annotations.delete(id);
    return a;
  }

  public updateAnnotation(annotation: Partial<ImageAnnotation>): ImageAnnotation {
    const updated = {
      ...this.annotations.get(annotation.id!),
      ...annotation,
    } as ImageAnnotation;
    this.annotations.set(updated.id, updated);
    return updated;
  }

  public getAnnotationById(id: string): ImageAnnotation | undefined {
    return this.annotations.get(id);
  }

  public setSelected(arg?: string | string[]): void {
    this.selected = arg ? (Array.isArray(arg) ? arg : [arg]) : [];
  }

  public cancelSelected(): void {
    this.selected = [];
  }
}

/**
 * A fake MatDialog whose dialogs are closed by the test via `close`.
 */
export class FakeDialog {
  public readonly opened: { component: unknown; config: MatDialogConfig }[] =
    [];
  private _closed?: Subject<unknown>;

  public open(component: unknown, config: MatDialogConfig) {
    this.opened.push({ component, config });
    const closed = new Subject<unknown>();
    this._closed = closed;
    return { afterClosed: () => closed.asObservable() };
  }

  /**
   * Close the last opened dialog with the specified result.
   */
  public close(result?: unknown): void {
    const closed = this._closed;
    this._closed = undefined;
    closed?.next(result);
    closed?.complete();
  }

  public get lastData(): any {
    return this.opened[this.opened.length - 1]?.config.data;
  }

  public asDialog(): MatDialog {
    return this as unknown as MatDialog;
  }
}

/**
 * Wait for pending promises.
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}
