import { useCallback, useRef, useState } from "react";
import {
  Button,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon, DragIndicator } from "@mui/icons-material";
import ItemSearch from "./ItemSearch";
import { EntityType } from "src/wikibase";
import { useList } from "react-use";
import { TableField } from "src/structure";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SortableList from "./SortableList";

interface NamedItemValue {
  item: string | null;
  name: string;
}

function NamedItem(props: {
  type: EntityType;
  value: NamedItemValue;
  onChange: (value: NamedItemValue) => void;
}) {
  const textFieldRef = useRef<HTMLDivElement>(null);

  return (
    <div css={{ display: "flex", paddingTop: "0.5em", flex: "1" }}>
      <ItemSearch
        type={props.type}
        popperWidth={(width) =>
          width + (textFieldRef.current?.clientWidth || 0)
        }
        value={props.value.item}
        onChange={(item) =>
          props.onChange({
            item: item && item.id,
            name: item?.label ?? props.value.name,
          })
        }
      />
      <TextField
        label="Name"
        fullWidth
        ref={textFieldRef}
        value={props.value.name}
        onChange={(event) =>
          props.onChange({
            item: props.value.item,
            name: (event.target as HTMLInputElement).value,
          })
        }
      />
    </div>
  );
}

function DeleteButton(props: Parameters<typeof IconButton>[0]) {
  return (
    <IconButton aria-label="delete" {...props}>
      <DeleteIcon />
    </IconButton>
  );
}

function EditTableField({
  field,
  onUpdate,
  onRemove,
}: {
  field: TableField<string | null>;
  onUpdate: (field: TableField<string | null>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      css={{ display: "flex", alignItems: "center" }}
      style={style}
    >
      <DragIndicator
        sx={{ cursor: "pointer", outline: "none" }}
        {...attributes}
        {...listeners}
      />
      <NamedItem
        type="property"
        value={{ item: field.property, name: field.name }}
        onChange={({ item, name }) =>
          onUpdate({
            uuid: field.uuid,
            property: item,
            name,
          })
        }
      />
      <DeleteButton size="small" onClick={onRemove} />
    </div>
  );
}

export default function StructurePanel() {
  const [instanceProp, setInstanceProp] = useState<string | null>(null);
  const [parentInfo, setParentInfo] = useState<NamedItemValue>({
    item: null,
    name: "",
  });
  const [fields, fieldsControl] = useList<TableField<string | null>>([]);

  const swapFields = useCallback((index1: number, index2: number) => {
    fieldsControl.set((fields) => {
      const copy = [...fields];
      copy[index1] = fields[index2];
      copy[index2] = fields[index1];
      return copy;
    });
  }, []);

  return (
    <>
      <div css={{ display: "flex", paddingTop: "0.5em" }}>
        <Typography variant="h5">Is instance(</Typography>
        <ItemSearch
          type="property"
          value={instanceProp}
          onChange={(value) => setInstanceProp(value && value.id)}
          sx={{ flex: "1" }}
        />
        <Typography variant="h5">) of</Typography>
      </div>
      <NamedItem type="item" value={parentInfo} onChange={setParentInfo} />
      <Divider sx={{ marginY: "0.5em" }} />
      <SortableList ids={fields.map((field) => field.uuid)} onSwap={swapFields}>
        {fields.map((field, i) => (
          <EditTableField
            key={field.uuid}
            field={field}
            onUpdate={(value) => fieldsControl.updateAt(i, value)}
            onRemove={() => fieldsControl.removeAt(i)}
          />
        ))}
      </SortableList>
      <Button
        onClick={() => {
          fieldsControl.push({
            uuid: crypto.randomUUID(),
            property: null,
            name: "",
          });
        }}
      >
        Add
      </Button>
    </>
  );
}
