import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyImgAnnotationListComponent } from './my-img-annotation-list.component';

describe('ImgAnnotationListComponent', () => {
  let component: MyImgAnnotationListComponent;
  let fixture: ComponentFixture<MyImgAnnotationListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyImgAnnotationListComponent]
    });
    fixture = TestBed.createComponent(MyImgAnnotationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
