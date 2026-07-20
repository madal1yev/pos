export function emitDataChanged() {
  window.dispatchEvent(new CustomEvent('pos:data-changed'));
}
