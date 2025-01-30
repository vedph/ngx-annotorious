import {
  AfterViewInit,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Observable, Subscription, distinctUntilChanged } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { DataPage } from '@myrmidon/ngx-tools';
import { GalleryImage } from '@myrmidon/ngx-annotorious';

import { GalleryListRepository } from '../../gallery-list.repository';
import { GalleryOptions } from '../../models';
import { GalleryOptionsService } from '../../services/gallery-options.service';
import { GalleryFilterComponent } from '../gallery-filter/gallery-filter.component';

@Component({
  selector: 'cadmus-gallery-list',
  templateUrl: './gallery-list.component.html',
  styleUrls: ['./gallery-list.component.css'],
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
    GalleryFilterComponent,
  ],
})
export class GalleryListComponent implements OnDestroy, AfterViewInit {
  private _sub?: Subscription;
  private _observer: IntersectionObserver | null = null;

  public page$: Observable<DataPage<GalleryImage>>;
  public loading$: Observable<boolean>;

  @ViewChildren('imageElement') imageElements!: QueryList<ElementRef>; // Use template ref
  lcpIndex: number | null = null;

  /**
   * The entries used to represent image gallery metadata filters.
   * Each entry is a metadatum, with ID=metadatum name and value=label.
   * If not set, users will be allowed to freely type a name rather
   * than picking it from a list.
   */
  public readonly entries = input<ThesaurusEntry[]>();

  /**
   * Emitted when an image is picked.
   */
  public readonly imagePick = output<GalleryImage>();

  public options: GalleryOptions;

  constructor(
    private _repository: GalleryListRepository,
    options: GalleryOptionsService
  ) {
    this.page$ = _repository.page$;
    this.loading$ = _repository.loading$;

    this.options = options.get();
    // update options when options change
    this._sub = options
      .select()
      .pipe(distinctUntilChanged())
      .subscribe((o) => (this.options = o));
  }

  ngAfterViewInit() {
    this._observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          const index = this.imageElements
            .toArray()
            .findIndex((el) => el.nativeElement === element);

          // only set once and check if found
          if (this.lcpIndex === null && index !== -1) {
            this.lcpIndex = index;
            // stop observing other elements after LCP is found
            this._observer?.disconnect();
          }
        }
      });
    });

    // observe changes in the QueryList
    this.imageElements.changes.subscribe(() => {
      this.imageElements.forEach((element) => {
        this._observer?.observe(element.nativeElement);
      });
    });
  }

  public isLCP(index: number): boolean {
    return this.lcpIndex === index;
  }

  public onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    // ensure height is auto after load
    img.style.height = 'auto';
  }

  public ngOnDestroy(): void {
    this._sub?.unsubscribe();
    this._observer?.disconnect();
  }

  public onPageChange(event: PageEvent): void {
    this._repository.setPage(event.pageIndex + 1, event.pageSize);
  }

  public reset(): void {
    this._repository.reset();
  }

  public pickImage(image: GalleryImage): void {
    this.imagePick.emit(image);
  }
}
