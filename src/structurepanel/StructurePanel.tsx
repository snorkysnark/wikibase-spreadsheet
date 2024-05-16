import {
  Button,
  ButtonGroup,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { MoreHoriz, DragIndicator } from "@mui/icons-material";
import {
  TableField,
  TableStructure,
  TableStructurePartial,
} from "src/structure";
import { EntitySearch } from "./EntitySearch";
import { MouseEventHandler, useCallback, useEffect, useState } from "react";
import { NamedItem, NamedItemValue } from "./NamedItem";
import { useList } from "@react-hookz/web";
import SortableList from "./SortableList";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EntityType, getItemUrl } from "src/wikibase";
import { produce } from "immer";
import CreateEntityDialog from "./CreateEntityDialog";
import { makeUuid } from "src/util";

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
          { id: "label" },
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

type FieldIndex = number | "table";

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

  const [fields, fieldsControl] = useList<TableFieldTmp>([]);

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

  const getFieldNameAt = useCallback(
    (index: FieldIndex) => {
      return index === "table" ? parentInfo.name : fields[index].name;
    },
    [parentInfo, fields]
  );
  const updateFieldAt = useCallback(
    (index: FieldIndex, id: string | null, name: string) => {
      if (index === "table") {
        setParentInfo({ item: id, name });
      } else {
        fieldsControl.set(
          produce((fields) => {
            fields[index].property = id;
            fields[index].name = name;
          })
        );
      }
    },
    []
  );

  const [fieldMenu, setFieldMenu] = useState<{
    type: EntityType;
    targetField: number | "table";
    anchor: HTMLElement;
  } | null>(null);
  useEffect(() => setFieldMenu(null), [fields]);

  const [createEntityDialog, setCreateEntityDialog] = useState<{
    type: EntityType;
    initialName: string;
    targetField: number | "table";
  } | null>(null);

  return (
    <>
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
            <NamedItem
              type="item"
              value={parentInfo}
              onChange={setParentInfo}
            />
            <IconButton
              aria-label="property settings"
              size="small"
              onClick={(event) =>
                setFieldMenu({
                  type: "item",
                  targetField: "table",
                  anchor: event.target as HTMLElement,
                })
              }
            >
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
                onClickMenu={(event) =>
                  setFieldMenu({
                    type: "property",
                    targetField: i,
                    anchor: event.target as HTMLElement,
                  })
                }
              />
            ))}
          </SortableList>
          <Button
            onClick={() => {
              fieldsControl.push({
                uuid: makeUuid(),
                property: null,
                name: "",
              });
            }}
          >
            Add
          </Button>
        </div>

        <ButtonGroup variant="outlined" fullWidth>
          <Button
            disabled={!isValidStructure()}
            onClick={() =>
              props.onChangeStucture({
                name: parentInfo.name,
                parentItem: parentInfo.item!,
                fields: fields as TableField[],
              })
            }
          >
            Apply
          </Button>
        </ButtonGroup>
      </div>

      <Menu
        open={!!fieldMenu}
        anchorEl={fieldMenu?.anchor}
        onClose={() => setFieldMenu(null)}
      >
        <MenuItem
          onClick={() => {
            setFieldMenu(null);
            setCreateEntityDialog({
              type: fieldMenu!.type,
              initialName: getFieldNameAt(fieldMenu!.targetField),
              targetField: fieldMenu!.targetField,
            });
          }}
        >
          New
        </MenuItem>
        {
          // Show for fields or existing tables
          (props.tableStructure ||
            typeof fieldMenu?.targetField === "number") && (
            <MenuItem
              onClick={() => {
                setFieldMenu(null);
                if (fieldMenu!.targetField === "table") {
                  props.onDelete();
                } else {
                  fieldsControl.removeAt(fieldMenu!.targetField);
                }
              }}
            >
              Delete
            </MenuItem>
          )
        }
      </Menu>

      {createEntityDialog && (
        <CreateEntityDialog
          type={createEntityDialog.type}
          defaultName={createEntityDialog.initialName}
          handleExit={(data) => {
            setCreateEntityDialog(null);
            if (data) {
              window.open(getItemUrl(data.type, data.id), "_blank")?.focus();

              const index = createEntityDialog.targetField;
              updateFieldAt(index, data.id, data.name);
            }
          }}
        />
      )}
    </>
  );
}
