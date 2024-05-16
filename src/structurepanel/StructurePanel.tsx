import {
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { MoreHoriz, DragIndicator } from "@mui/icons-material";
import { TableStructure, TableStructurePartial } from "src/structure";
import { EntitySearch } from "./EntitySearch";
import { MouseEventHandler, useMemo, useState } from "react";
import { NamedItem, NamedItemValue } from "./NamedItem";
import { useList } from "@react-hookz/web";
import SortableList from "./SortableList";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import hyperid from "hyperid";

interface TableFieldTmp {
  uuid: string;
  name: string;
  property: string | null;
}

function EditTableField({
  field,
  onUpdate,
  onClickMenu,
}: {
  field: TableFieldTmp;
  onUpdate: (field: TableFieldTmp) => void;
  onClickMenu: MouseEventHandler<HTMLButtonElement>;
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
        extraOptions={[
          { id: "itemID" },
          { id: "description" },
          { id: "aliases" },
        ]}
        value={{ item: field.property, name: field.name }}
        onChange={({ item, name }) =>
          onUpdate({
            uuid: field.uuid,
            property: item,
            name,
          })
        }
      />
      <IconButton
        aria-label="property settings"
        size="small"
        onClick={onClickMenu}
      >
        <MoreHoriz />
      </IconButton>
    </div>
  );
}

export default function StructurePanel(props: {
  isInstanceProperty: string | null;
  onChangeInstanceProperty: (value: string | null) => void;
  tableStructure: TableStructure | null;
  onChangeStucture: (tableStructure: TableStructurePartial) => void;
  onDelete: () => void;
}) {
  const [parentInfo, setParentInfo] = useState<NamedItemValue>({
    item: null,
    name: "",
  });

  const makeId = useMemo(() => hyperid(), []);
  const [fields, fieldsControl] = useList<TableFieldTmp>([]);

  return (
    <div
      css={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div css={{ flex: "1" }}>
        <div
          css={{
            display: "flex",
            paddingTop: "0.5em",
          }}
        >
          <Typography variant="h5">Is instance(</Typography>
          <EntitySearch
            type="property"
            value={props.isInstanceProperty}
            onChange={(value) =>
              props.onChangeInstanceProperty(value && value.data.id)
            }
            sx={{ flex: "1" }}
          />
          <Typography variant="h5">) of</Typography>
        </div>
        <div css={{ display: "flex", alignItems: "center" }}>
          <NamedItem type="item" value={parentInfo} onChange={setParentInfo} />
          <IconButton aria-label="property settings" size="small">
            <MoreHoriz />
          </IconButton>
        </div>
        <Divider sx={{ marginY: "0.5em" }} />
        <SortableList
          ids={fields.map((field) => field.uuid)}
          onMove={(fromIndex, toIndex) => {
            const element = fields[fromIndex];
            fieldsControl.removeAt(fromIndex);
            fieldsControl.insertAt(toIndex, element);
          }}
        >
          {fields.map((field, i) => (
            <EditTableField
              key={field.uuid}
              field={field}
              onUpdate={(value) => fieldsControl.updateAt(i, value)}
              onClickMenu={() => {}}
            />
          ))}
        </SortableList>
        <Button
          onClick={() => {
            fieldsControl.push({
              uuid: makeId(),
              property: null,
              name: "",
            });
          }}
        >
          Add
        </Button>
      </div>

      <ButtonGroup variant="outlined" fullWidth></ButtonGroup>
    </div>
  );
}
