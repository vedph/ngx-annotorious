import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OsdImgAnnotationPgComponent } from './osd-img-annotation-pg.component';

describe('OsdImgAnnotationPgComponent', () => {
  let component: OsdImgAnnotationPgComponent;
  let fixture: ComponentFixture<OsdImgAnnotationPgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OsdImgAnnotationPgComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OsdImgAnnotationPgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
