import { MouseEventHandler, useEffect, useRef, useState } from "react";
import {
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { MoreHoriz, DragIndicator } from "@mui/icons-material";
import ItemSearch from "./ItemSearch";
import { EntityType, getItemUrl } from "src/wikibase";
import {
  TableField,
  TableStructure,
  TableStructurePartial,
} from "src/structure";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SortableList from "./SortableList";
import { useList } from "src/hooks";
import CreateEntityDialog from "./CreateEntityDialog";

import { searchEntities } from "src/wikibase";

interface NamedItemValue {
  item: string | null;
  name: string;
}

function NamedItem(props: {
  type: EntityType;
  value: NamedItemValue;
  onChange: (value: NamedItemValue) => void;
  specialOptions?: string[];
}) {
  const textFieldRef = useRef<HTMLDivElement>(null);

  return (
    <div css={{ display: "flex", paddingTop: "0.5em", flex: "1" }}>
      <ItemSearch
        sx={{ width: "10em" }}
        type={props.type}
        specialOptions={props.specialOptions}
        popperWidth={(width) =>
          width + (textFieldRef.current?.clientWidth || 0)
        }
        value={props.value.item}
        onChange={(item) =>
          props.onChange({
            item: item && item.id,
            name: item?.label ?? item?.id ?? props.value.name,
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

function EditTableField({
  field,
  onUpdate,
  onClickMenu,
}: {
  field: TableField<string | null>;
  onUpdate: (field: TableField<string | null>) => void;
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
        specialOptions={["label", "description"]}
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
  existing?: boolean;
  tableStructure: TableStructure<string> | null;
  onChangeStucture: (tableStructure: TableStructurePartial<string>) => void;
  onDelete: () => void;
}) {
  const [parentInfo, setParentInfo] = useState<NamedItemValue>({
    item: null,
    name: "",
  });
  const [fields, fieldsControl] = useList<TableField<string | null>>([]);

  useEffect(() => {
    if (props.tableStructure) {
      setParentInfo({
        item: props.tableStructure.parentItem,
        name: props.tableStructure.name,
      });
      fieldsControl.set(props.tableStructure.fields);
    } else {
      setParentInfo({ item: null, name: "" });
      fieldsControl.set([]);
    }
  }, [props.tableStructure]);

  const isValidStructure = () => {
    if (!parentInfo.name || !parentInfo.item) return false;
    for (const field of fields) {
      if (!field.name || !field.property) return false;
    }
    return true;
  };

  const [fieldMenu, setFieldMenu] = useState<{
    index: number;
    anchor: HTMLElement;
  } | null>(null);
  useEffect(() => setFieldMenu(null), [fields]);

  const [createEntityDialog, setCreateEntityDialog] = useState<{
    type: EntityType;
    initialName: string;
    targetField: number;
  } | null>(null);

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
          <ItemSearch
            type="property"
            value={props.isInstanceProperty}
            onChange={(value) =>
              props.onChangeInstanceProperty(value && value.id)
            }
            sx={{ flex: "1" }}
          />
          <Typography variant="h5">) of</Typography>
        </div>
        <NamedItem type="item" value={parentInfo} onChange={setParentInfo} />
        <Divider sx={{ marginY: "0.5em" }} />
        <SortableList
          ids={fields.map((field) => field.uuid)}
          onSwap={fieldsControl.swap}
        >
          {fields.map((field, i) => (
            <EditTableField
              key={field.uuid}
              field={field}
              onUpdate={(value) => fieldsControl.updateAt(i, value)}
              onClickMenu={(event) =>
                setFieldMenu({ index: i, anchor: event.target as HTMLElement })
              }
            />
          ))}
        </SortableList>
        <Menu
          open={!!fieldMenu}
          anchorEl={fieldMenu?.anchor}
          onClose={() => setFieldMenu(null)}
        >
          <MenuItem
            onClick={() => {
              setFieldMenu(null);
              if (fieldMenu)
                setCreateEntityDialog({
                  type: "property",
                  initialName: fields[fieldMenu.index].name,
                  targetField: fieldMenu.index,
                });
            }}
          >
            Create
          </MenuItem>
          <MenuItem
            onClick={() => {
              setFieldMenu(null);
              if (fieldMenu) fieldsControl.removeAt(fieldMenu.index);
            }}
          >
            Delete
          </MenuItem>
        </Menu>
        {createEntityDialog && (
          <CreateEntityDialog
            type={createEntityDialog.type}
            defaultName={createEntityDialog.initialName}
            handleExit={(data) => {
              setCreateEntityDialog(null);
              if (data) {
                window.open(getItemUrl(data.type, data.id), "_blank")?.focus();

                if (createEntityDialog) {
                  const index = createEntityDialog.targetField;
                  fieldsControl.updateAt(index, {
                    uuid: fields[index].uuid,
                    property: data.id,
                    name: data.name,
                  });
                }
              }
            }}
          />
        )}
        <Button
          css={{ alignSelf: "flex-start" }}
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
        <Button onClick={() => searchEntities({ search: "aaa", type: "fff" })}>
          Request
        </Button>
      </div>

      <ButtonGroup variant="outlined" fullWidth>
        <Button
          sx={{ flex: "3" }}
          disabled={!isValidStructure()}
          onClick={() =>
            props.onChangeStucture({
              name: parentInfo.name,
              parentItem: parentInfo.item!,
              // @ts-ignore
              fields: fields,
            })
          }
        >
          Save
        </Button>
        {props.existing && (
          <Button sx={{ flex: "1" }} color="error" onClick={props.onDelete}>
            Delete
          </Button>
        )}
      </ButtonGroup>
    </div>
  );
}
