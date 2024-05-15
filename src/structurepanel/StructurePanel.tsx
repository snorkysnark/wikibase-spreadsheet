import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { produce } from "immer";

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
        sx={{ width: "10em" }}
        type={props.type}
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
  field: TableField<boolean>;
  onUpdate: (field: TableField<boolean>) => void;
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
  existing?: boolean;
  tableStructure: TableStructure | null;
  onChangeStucture: (tableStructure: TableStructurePartial) => void;
  onDelete: () => void;
}) {
  const [parentInfo, setParentInfo] = useState<NamedItemValue>({
    item: null,
    name: "",
  });
  const [fields, fieldsControl] = useList<TableField<boolean>>([]);
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
        <div css={{ display: "flex", alignItems: "center" }}>
          <NamedItem type="item" value={parentInfo} onChange={setParentInfo} />
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
          onMove={fieldsControl.move}
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
                  type: fieldMenu.type,
                  initialName: getFieldNameAt(fieldMenu.targetField),
                  targetField: fieldMenu.targetField,
                });
            }}
          >
            New
          </MenuItem>
          {(props.existing || typeof fieldMenu?.targetField === "number") && (
            <MenuItem
              onClick={() => {
                setFieldMenu(null);
                if (fieldMenu) {
                  if (fieldMenu.targetField === "table") {
                    props.onDelete();
                  } else {
                    fieldsControl.removeAt(fieldMenu.targetField);
                  }
                }
              }}
            >
              Delete
            </MenuItem>
          )}
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
                  updateFieldAt(index, data.id, data.name);
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
      </div>

      <ButtonGroup variant="outlined" fullWidth>
        <Button
          sx={{ flex: "3" }}
          disabled={!isValidStructure()}
          onClick={() =>
            props.onChangeStucture({
              name: parentInfo.name,
              parentItem: parentInfo.item!,
              fields,
            })
          }
        >
          Save
        </Button>
      </ButtonGroup>
    </div>
  );
}
