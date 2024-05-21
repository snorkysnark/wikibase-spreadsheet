import { ReactNode } from "react";
import { DndContext, closestCorners, UniqueIdentifier } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext } from "@dnd-kit/sortable";

export function SortableDndContext({
  onMove,
  children,
}: {
  onMove: (index1: number, index2: number) => void;
  children: ReactNode;
}) {
  return (
    <DndContext
      collisionDetection={closestCorners}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={(event) => {
        if (event.active.data.current && event.over?.data.current) {
          onMove(
            event.active.data.current.sortable.index,
            event.over.data.current.sortable.index
          );
        }
      }}
    >
      {children}
    </DndContext>
  );
}

export default function SortableList({
  ids,
  onMove,
  children,
}: {
  ids: UniqueIdentifier[];
  onMove: (index1: number, index2: number) => void;
  children: ReactNode;
}) {
  return (
    <SortableDndContext onMove={onMove}>
      <SortableContext items={ids}>{children}</SortableContext>
    </SortableDndContext>
  );
}
