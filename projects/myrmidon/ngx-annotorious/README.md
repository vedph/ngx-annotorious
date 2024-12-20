# NgxAnnotorious

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.

The logic inferred from the Annotorious flow is described below for each operation.

## Creating Annotations

On create event (`onCreateAnnotation`):

1. popup a dialog and edit the received annotation object.
2. if the dialog is discarded, just stop and clear selection (via `setSelection()`).
3. else, add the annotation (via `addAnnotation`). A wrapper for that annotation with additional payload is saved in the list storage.

This seems to work:

- I can see that the annotation object is present both in Annotorious and in list.
- I can select/deselect the annotation and see visuals change accordingly and events fired.

Yet there are bugs:

🐛 If I now select the annotation and drag to move it, it is moved but the original rectangle in the primitive position is never removed. So I end up with a ghost rectangle. The rectangle corresponding to the new position is actively responding to selection and deselection, while the ghost one just sits there but is not interactive, as expected.

🐛 The same happens when deleting, see [below](#deleting-annotations).

🐛 If I create a couple of annotations and select one or another, the selection events are fired but no visual hint (the decorators at the rectangle angles) appear.

## Deleting Annotations

🐛 If I delete an annotation using the red bin button, the annotation is removed both from Annotorious (via `removeAnnotation(id)`) and the list. I also get the deleted event as a feedback.

Yet, a ghost rectangle still remains there, no longer interactive as it happens when moving an annotation.

Repro steps:

1. create an annotation and enter some text, then click OK.
2. delete the created annotation by clicking the trash button.

## Editing Annotations

1. create an annotation and enter some text, then click OK.
2. edit it by clicking the edit button and change the text, then click OK.
3. TODO
