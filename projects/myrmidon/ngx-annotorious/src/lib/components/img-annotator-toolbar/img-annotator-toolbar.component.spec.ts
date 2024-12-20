import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgAnnotatorToolbarComponent } from './img-annotator-toolbar.component';

describe('ImgAnnotatorToolbarComponent', () => {
  let component: ImgAnnotatorToolbarComponent;
  let fixture: ComponentFixture<ImgAnnotatorToolbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ImgAnnotatorToolbarComponent]
    });
    fixture = TestBed.createComponent(ImgAnnotatorToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
