import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryImageAnnotatorPgComponent } from './gallery-image-annotator-pg.component';

describe('MyGalleryImageAnnotatorComponent', () => {
  let component: GalleryImageAnnotatorPgComponent;
  let fixture: ComponentFixture<GalleryImageAnnotatorPgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GalleryImageAnnotatorPgComponent]
    });
    fixture = TestBed.createComponent(GalleryImageAnnotatorPgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
