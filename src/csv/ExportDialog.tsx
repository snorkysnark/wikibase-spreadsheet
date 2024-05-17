import {
  Dialog,
  DialogActions,
  DialogTitle,
  Button,
  DialogContent,
  TextField,
} from "@mui/material";
import { DragIndicator } from "@mui/icons-material";
import { useLayoutEffect } from "react";
import { DelimiterMenu, useDelimiter } from "./DelimiterMenu";
import {
  CsvMapping,
  OrderedMap,
  TableField,
  TableStructure,
} from "src/structure";
import { useList } from "@react-hookz/web";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SortableList from "src/structurepanel/SortableList";
import { produce } from "immer";

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

export function ExportDialog({
  tableStructure,
  csvMappings,
  onClose,
  onSubmit,
}: {
  tableStructure: TableStructure;
  csvMappings: OrderedMap<CsvMapping>;
  onClose(): void;
  onSubmit(params: ExportParameters): void;
}) {
  const [fields, alterFields] = useList<ExportField>([]);

  useLayoutEffect(() => {
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
  }, [tableStructure.fields]);

  const [delimiterState, setDelimiterState] = useDelimiter();

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Export CSV</DialogTitle>
      <DialogContent>
        <DelimiterMenu value={delimiterState} onChange={setDelimiterState} />
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Editor</th>
              <th>CSV</th>
            </tr>
          </thead>
          <tbody>
            <SortableList
              ids={fields.map((exportField) => exportField.field.uuid)}
              onMove={(fromIndex, toIndex) => {
                const element = fields[fromIndex];
                alterFields.removeAt(fromIndex);
                alterFields.insertAt(toIndex, element);
              }}
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
            </SortableList>
          </tbody>
        </table>
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
