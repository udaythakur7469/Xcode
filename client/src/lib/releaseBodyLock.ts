// Radix's Dialog/DropdownMenu primitives lock <body> (pointer-events, and
// FloatingDialog separately locks overflow/paddingRight - see
// FloatingDialog.tsx) while an overlay is open, and release it again once
// that overlay's own close/unmount cycle finishes. When an overlay closes
// programmatically from inside an async handler WHILE a second overlay is
// still mounted alongside it (a DropdownMenu behind a Dialog, a Dialog
// nested inside a FloatingDialog, etc.) that release can get left stuck -
// the page looks normal but nothing is clickable until a hard reload.
//
// This is a standalone, dependency-free safety net for that: call
// releaseBodyLock() right after any flow that closes an overlay
// programmatically (logout being the concrete case it was written for).
// Kept in its own file, separate from LogoutDialog, so it's reusable
// anywhere else this class of bug shows up.
export function releaseBodyLock() {
  if (typeof document === "undefined") return;

  document.body.style.removeProperty("pointer-events");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
}
