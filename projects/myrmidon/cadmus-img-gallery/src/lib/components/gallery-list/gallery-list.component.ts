import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
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
export class GalleryListComponent implements OnDestroy {
  private _sub?: Subscription;

  public page$: Observable<DataPage<GalleryImage>>;
  public loading$: Observable<boolean>;

  /**
   * The entries used to represent image gallery metadata filters.
   * Each entry is a metadatum, with ID=metadatum name and value=label.
   * If not set, users will be allowed to freely type a name rather
   * than picking it from a list.
   */
  @Input()
  public entries: ThesaurusEntry[] | undefined;

  /**
   * Emitted when an image is picked.
   */
  @Output()
  public imagePick: EventEmitter<GalleryImage>;

  public options: GalleryOptions;

  constructor(
    private _repository: GalleryListRepository,
    options: GalleryOptionsService
  ) {
    this.page$ = _repository.page$;
    this.loading$ = _repository.loading$;
    this.imagePick = new EventEmitter<GalleryImage>();

    this.options = options.get();
    // update options when options change
    this._sub = options
      .select()
      .pipe(distinctUntilChanged())
      .subscribe((o) => (this.options = o));
  }

  public ngOnDestroy(): void {
    this._sub?.unsubscribe();
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
