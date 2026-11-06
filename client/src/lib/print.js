/**
 * Prints one element (an invoice, a report table) without the rest of the page.
 *
 * The element is copied into a hidden iframe together with the page's styles,
 * printed there, and the iframe removed. The live page is never touched, so
 * React keeps working afterwards. (Replacing document.body.innerHTML, a common
 * shortcut, detaches React and leaves every button dead.)
 */
export function printElement(element) {
  if (!element) return;

  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const styles = [...document.querySelectorAll('style, link[rel="stylesheet"]')]
    .map((node) => node.outerHTML)
    .join('');

  doc.open();
  doc.write(
    `<!doctype html><html><head><title>${document.title}</title>${styles}` +
      // Print in black on white whatever the app theme is, and drop on-screen controls.
      '<style>body{padding:16px} *{color:#000 !important;background:#fff !important;' +
      'box-shadow:none !important;border-color:#ccc !important} .no-print{display:none !important}' +
      '</style></head>' +
      `<body>${element.outerHTML}</body></html>`
  );
  doc.close();

  frame.contentWindow.focus();
  // Give fonts and images a moment to load before opening the print dialog.
  setTimeout(() => {
    frame.contentWindow.print();
    frame.remove();
  }, 250);
}
