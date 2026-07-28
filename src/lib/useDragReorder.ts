import { useState } from 'react';

// Shared native-HTML5-DnD wiring for a reorderable list (Queue.tsx's
// desktop panel and ExpandedPlayer's mobile Antrian tab both need this
// identical drag-index tracking, just over different index spaces).
export function useDragReorder(onReorder: (from: number, to: number) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  function dragProps(index: number) {
    return {
      draggable: true,
      onDragStart: () => setDragIndex(index),
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDrop: () => { if (dragIndex !== null) onReorder(dragIndex, index); setDragIndex(null); },
      onDragEnd: () => setDragIndex(null),
    };
  }
  return { dragIndex, dragProps };
}
