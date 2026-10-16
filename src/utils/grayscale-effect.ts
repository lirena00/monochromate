// Keep this function self-contained: scripting.executeScript serializes it.
export function updateGrayscaleEffect(enabled: boolean, intensity = 100): void {
  const overlayId = "monochromate-overlay";
  const styleId = "monochromate-top-layer-style";
  let overlay = document.getElementById(overlayId);
  let style = document.getElementById(styleId);

  if (!enabled) {
    overlay?.remove();
    style?.remove();
    return;
  }

  const amount = Number.isFinite(intensity)
    ? Math.min(100, Math.max(0, intensity))
    : 100;
  const filter = `grayscale(${amount}%)`;
  // Separate rules prevent an unsupported selector from invalidating the others.
  // :modal excludes ordinary, non-modal dialogs already covered by the overlay.
  // Filter the backdrop's own color; backdrop-filter would filter the page again.
  const selectors = [
    "dialog:modal",
    "[popover]:popover-open",
    ":fullscreen",
    ":-webkit-full-screen",
  ];
  const css = selectors
    .map(
      (selector) => `
        ${selector} { filter: ${filter} !important; }
        ${selector}::backdrop {
          filter: ${filter} !important;
        }
      `
    )
    .join("\n");

  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.documentElement.appendChild(style);
  }
  if (style.textContent !== css) {
    style.textContent = css;
  }

  const fullscreenElement =
    document.fullscreenElement ||
    (document as Document & { webkitFullscreenElement?: Element })
      .webkitFullscreenElement;
  if (fullscreenElement) {
    overlay?.remove();
    return;
  }

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 2147483647;
    `;
    document.documentElement.appendChild(overlay);
  }
  overlay.style.backdropFilter = filter;
}
