/** Extract dominant color from image URL, returns "r,g,b" string */
export function extractColor(url: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') { resolve('29,185,84'); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 1;
        const ctx = c.getContext('2d');
        ctx?.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx?.getImageData(0, 0, 1, 1).data ?? [29, 185, 84];
        // Darken very bright colors a bit
        resolve(`${Math.floor(r * 0.85)},${Math.floor(g * 0.85)},${Math.floor(b * 0.85)}`);
      } catch { resolve('29,185,84'); }
    };
    img.onerror = () => resolve('29,185,84');
    img.src = url;
  });
}
