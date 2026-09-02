---
description: How a component is authored, which primitive owns which job, and where a value comes from
paths:
  - "src/components/**"
  - "src/pages/**"
  - "src/app.css"
---

## Choosing

`src/components/ui/` holds the primitives. `Button` is the only button. `Field` wraps every form control and styles the input it holds. `BaseDialog` is the only dialog shell. Reach for the primitive before writing an element.

A component that looks wrong is fixed with a prop or in the component. Never a wrapper div with flex, padding or width to make it size, and never reach past it.

A component that does not exist is authored in `src/components/ui/` and then consumed. Prove first that it is missing, and second that it cannot be composed from what is there.

## Authoring

One destructured `$props()` with a TSDoc line on every prop. `$derived` for computed values, `$effect` only for work outside the render. No comments in a component.

The root class is `dnd-<component>` and a variant is `dnd-<component>-<value>`. A variant prop is a singular lowercase enum defaulted in the destructure.

Never declare `style` or `class` as a prop name.

## Look

Colour, spacing, radius, type, shadow, border width and the focus ring come from the tokens in `src/app.css`. No literal colour values anywhere.

`src/app.css` holds five themes: medieval, forest, fire, arcane and ocean. A theme is a token re-declaration under `[data-theme]` and no component knows which one is active.

`src/lib/dialogs/theme.ts` owns the theme list and the `dnd_theme` key. `getTheme` and `setTheme` are the only way a theme is read or applied. Never write `data-theme` or the key directly.

## Accessibility

A clickable card is a `<button>`, not a div with a handler. A file drop zone carries a role and an `aria-label`. Every control a `Field` wraps carries the id the `Field` points at.

`just check` is zero warnings. An a11y warning is a regression, not a note.
