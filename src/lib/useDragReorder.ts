import { useRef, useState } from 'react';

// Pointer-Events-based reorder (not native HTML5 drag-and-drop) — DnD's
// draggable/dragstart/drop events are mouse-only and never fire on mobile
// touch at all, which is why the queue drag didn't work on a phone. Pointer
// Events fire the same way for mouse and touch, so one implementation
// covers both. Each row exposes a small handle (data-queue-index) rather
// than making the whole row draggable, so the list can still be scrolled
// normally by touching anywhere else on a row.
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  function indexAtPoint(x: number, y: number): number | null {
    const el = (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-queue-index]');
    return el ? Number(el.dataset.queueIndex) : null;
  }

  function handleProps(index: number) {
    return {
      'data-queue-index': index,
      onPointerDown: (e: React.PointerEvent) => {
        dragIndexRef.current = index;
        setDragIndex(index);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (dragIndexRef.current === null) return;
        const idx = indexAtPoint(e.clientX, e.clientY);
        if (idx !== null) setOverIndex(idx);
      },
      onPointerUp: (e: React.PointerEvent) => {
        if (dragIndexRef.current !== null) {
          const idx = indexAtPoint(e.clientX, e.clientY);
          if (idx !== null && idx !== dragIndexRef.current) onReorder(dragIndexRef.current, idx);
        }
        dragIndexRef.current = null;
        setDragIndex(null);
        setOverIndex(null);
      },
      onPointerCancel: () => {
        dragIndexRef.current = null;
        setDragIndex(null);
        setOverIndex(null);
      },
    };
  }

  return { dragIndex, overIndex, handleProps };
}
