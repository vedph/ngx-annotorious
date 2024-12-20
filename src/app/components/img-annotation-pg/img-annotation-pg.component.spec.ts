import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImgAnnotationPgComponent } from './img-annotation-pg.component';

describe('ImgAnnotationComponent', () => {
  let component: ImgAnnotationPgComponent;
  let fixture: ComponentFixture<ImgAnnotationPgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImgAnnotationPgComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImgAnnotationPgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
