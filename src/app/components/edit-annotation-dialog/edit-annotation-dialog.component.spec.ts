import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAnnotationDialogComponent } from './edit-annotation-dialog.component';

describe('EditAnnotationDialogComponent', () => {
  let component: EditAnnotationDialogComponent;
  let fixture: ComponentFixture<EditAnnotationDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditAnnotationDialogComponent]
    });
    fixture = TestBed.createComponent(EditAnnotationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
