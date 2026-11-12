export type Palette = {
  creature: string;
  ghost: string;
};

const FALLBACK: Palette = { creature: '#ff8a4c', ghost: '#d4f3ff' };

// Colors live in CSS so light and dark mode are defined in one place.
export function readPalette(root: HTMLElement): Palette {
  const style = getComputedStyle(root);
  const read = (name: string, fallback: string): string =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    creature: read('--creature', FALLBACK.creature),
    ghost: read('--ghost', FALLBACK.ghost),
  };
}
