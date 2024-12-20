import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgAnnotatorToolbarPgComponent } from './img-annotator-toolbar-pg.component';

describe('ImgAnnotatorToolbarPgComponent', () => {
  let component: ImgAnnotatorToolbarPgComponent;
  let fixture: ComponentFixture<ImgAnnotatorToolbarPgComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ImgAnnotatorToolbarPgComponent]
    });
    fixture = TestBed.createComponent(ImgAnnotatorToolbarPgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
