import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAnnotationComponent } from './edit-annotation.component';

describe('EditAnnotationComponent', () => {
  let component: EditAnnotationComponent;
  let fixture: ComponentFixture<EditAnnotationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditAnnotationComponent]
    });
    fixture = TestBed.createComponent(EditAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
