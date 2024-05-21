import {
  Dialog,
  DialogActions,
  DialogTitle,
  Button,
  DialogContent,
  TextField,
} from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { useLayoutEffect, useState } from "react";
import {
  DelimiterMenu,
  parseDelimiterState,
  useDelimiter,
} from "./DelimiterMenu";
import {
  CsvMapping,
  CsvMappingActions,
  FieldMapping,
  OrderedMap,
  TableField,
  TableStructure,
} from "src/structure";
import { useList } from "@react-hookz/web";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableDndContext } from "src/structurepanel/SortableList";
import { produce } from "immer";
import MappingPicker from "./MappingPicker";
import { uuidMap } from "src/util";

export interface ExportField {
  csvName: string;
  field: TableField;
}

export interface ExportParameters {
  delimiter: string;
  fields: ExportField[];
}

function FieldEditor({
  fieldParams,
  setCsvName,
}: {
  fieldParams: ExportField;
  setCsvName(value: string): void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: fieldParams.field.uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td
        css={{ cursor: "pointer", outline: "none" }}
        {...attributes}
        {...listeners}
      >
        <DragIndicator />
      </td>
      <td
        css={{
          fontWeight: fieldParams.field.uuid === "itemId" ? "bold" : undefined,
        }}
      >
        {fieldParams.field.name}
      </td>
      <td>
        <TextField
          value={fieldParams.csvName}
          onChange={(event) => setCsvName(event.target.value)}
        />
      </td>
    </tr>
  );
}

function loadJsonMappings(
  tableStructure: TableStructure,
  mappings: FieldMapping[]
): ExportField[] {
  const result: ExportField[] = [];

  const fieldByUuid = uuidMap(tableStructure.fields);
  fieldByUuid.set("itemId", {
    uuid: "itemId",
    name: "itemId",
    property: "itemId",
  });

  for (const mapping of mappings) {
    const field = fieldByUuid.get(mapping.fieldUuid);
    if (field) {
      result.push({ csvName: mapping.csvField, field });
      fieldByUuid.delete(mapping.fieldUuid);
    }
  }

  for (const field of fieldByUuid.values()) {
    result.push({ csvName: "", field });
  }

  return result;
}

function updatedJsonMappings(
  oldMappings: FieldMapping[] | undefined,
  fields: ExportField[]
): FieldMapping[] {
  const fieldIsKey = new Map<string, boolean>();
  oldMappings?.forEach((mapping) =>
    fieldIsKey.set(mapping.fieldUuid, mapping.isKey)
  );

  return fields
    .filter((field) => !!field.csvName)
    .map(({ field, csvName }) => ({
      isKey: !!fieldIsKey.get(field.uuid),
      fieldUuid: field.uuid,
      csvField: csvName,
    }));
}

export function ExportDialog({
  tableStructure,
  csvMappings,
  alterMappings,
  onClose,
  onSubmit,
}: {
  tableStructure: TableStructure;
  csvMappings: OrderedMap<CsvMapping>;
  alterMappings: CsvMappingActions;
  onClose(): void;
  onSubmit(params: ExportParameters): void;
}) {
  const [mapping, setMapping] = useState<CsvMapping | null>(null);

  const [delimiterState, setDelimiterState] = useDelimiter();
  const [fields, alterFields] = useList<ExportField>([]);

  useLayoutEffect(() => {
    if (mapping) {
      setDelimiterState(parseDelimiterState(mapping.delimiter));
      alterFields.set(loadJsonMappings(tableStructure, mapping.pairs));
    } else {
      alterFields.set([
        {
          csvName: "itemId",
          field: { uuid: "itemId", name: "itemId", property: "itemId" },
        },
        ...tableStructure.fields.map((field) => ({
          csvName: field.name,
          field,
        })),
      ]);
    }
  }, [tableStructure, mapping]);

  const makeUpdatedMapping = (current: CsvMapping | null) => {
    return {
      name: current?.name || "",
      delimiter: delimiterState.delimiter,
      pairs: updatedJsonMappings(current?.pairs, fields),
    };
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Export CSV</DialogTitle>
      <DialogContent>
        <MappingPicker
          value={mapping}
          onChange={setMapping}
          csvMappings={csvMappings}
          alterMappings={alterMappings}
          makeUpdated={makeUpdatedMapping}
        />
        <DelimiterMenu value={delimiterState} onChange={setDelimiterState} />
        <SortableDndContext
          onMove={(fromIndex, toIndex) => {
            const element = fields[fromIndex];
            alterFields.removeAt(fromIndex);
            alterFields.insertAt(toIndex, element);
          }}
        >
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Editor</th>
                <th>CSV</th>
              </tr>
            </thead>
            <tbody>
              <SortableContext
                items={fields.map((exportField) => exportField.field.uuid)}
              >
                {fields.map((exportField, i) => (
                  <FieldEditor
                    key={exportField.field.uuid}
                    fieldParams={exportField}
                    setCsvName={(value) =>
                      alterFields.set(
                        produce((fields) => {
                          fields[i].csvName = value;
                        })
                      )
                    }
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </SortableDndContext>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            onSubmit({
              delimiter: delimiterState.delimiter,
              fields: fields.filter((field) => !!field.csvName),
            });
          }}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}
