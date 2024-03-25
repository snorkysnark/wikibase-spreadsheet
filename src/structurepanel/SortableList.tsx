import { ReactNode } from "react";
import { DndContext, closestCorners, UniqueIdentifier } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext } from "@dnd-kit/sortable";

export default function SortableList({
  ids,
  onSwap,
  children,
}: {
  ids: UniqueIdentifier[];
  onSwap: (index1: number, index2: number) => void;
  children: ReactNode;
}) {
  return (
    <DndContext
      collisionDetection={closestCorners}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={(event) => {
        if (event.active.data.current && event.over?.data.current) {
          onSwap(
            event.active.data.current.sortable.index,
            event.over.data.current.sortable.index
          );
        }
      }}
    >
      <SortableContext items={ids}>{children}</SortableContext>
    </DndContext>
  );
}
