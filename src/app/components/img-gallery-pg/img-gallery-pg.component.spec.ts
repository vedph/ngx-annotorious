import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgGalleryPgComponent } from './img-gallery-pg.component';

describe('ImgGalleryPgComponent', () => {
  let component: ImgGalleryPgComponent;
  let fixture: ComponentFixture<ImgGalleryPgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImgGalleryPgComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImgGalleryPgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
