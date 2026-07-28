// Pure queue-reorder math, split out of page.tsx's handleReorderQueue so it
// can be self-checked without React/DOM (see scripts/test-reorder.ts).

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
}

// Where does the currently-playing index end up after moving an item from
// `from` to `to`? If the playing track itself moved, it's now at `to`.
// Otherwise it shifts by one only if the move crossed over it.
export function adjustIndexAfterMove(selected: number, from: number, to: number): number {
  if (from === selected) return to;
  if (from < selected && to >= selected) return selected - 1;
  if (from > selected && to <= selected) return selected + 1;
  return selected;
}
