import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  ToggleButton,
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Key as KeyIcon,
} from "@mui/icons-material";
import { MuiFileInput } from "mui-file-input";
import { useLayoutEffect, useMemo, useState } from "react";
import { DelimiterMenu, DelimiterState } from "./DelimiterMenu";
import { TableField, TableStructure } from "src/structure";
import { useCsvHeaders } from "./hooks";
import { produce } from "immer";

export interface ImportField<AllowNull extends boolean = false> {
  isKey: boolean;
  csvName: string;
  hotMapping: AllowNull extends true ? TableField | null : TableField;
}

export interface ImportParameters {
  delimiter: string;
  fields: ImportField[];
}

export function ImportDialog({
  onClose,
  onSubmit,
  tableStructure,
}: {
  onClose(): void;
  onSubmit(file: File, params: ImportParameters): void;
  tableStructure: TableStructure;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [delimiterState, setDelimiterState] = useState<DelimiterState>({
    delimiter: ",",
    custom: false,
  });

  const headers = useCsvHeaders(file, delimiterState.delimiter);
  const [csvFields, setCsvFields] = useState<ImportField<boolean>[] | null>(
    null
  );
  useLayoutEffect(() => {
    setCsvFields(
      headers
        ? headers.map((header) => ({
            isKey: false,
            csvName: header,
            hotMapping: null,
          }))
        : null
    );
  }, [headers]);

  const hotFields = useMemo<TableField[]>(
    () => [
      { uuid: "itemId", name: "itemId", property: "itemId" },
      ...tableStructure.fields,
    ],
    [tableStructure]
  );

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Import CSV</DialogTitle>
      <DialogContent>
        <DelimiterMenu value={delimiterState} onChange={setDelimiterState} />
        <MuiFileInput
          sx={{ width: "100%" }}
          value={file}
          onChange={setFile}
          placeholder="Attach File"
          InputProps={{
            inputProps: { accept: "text/csv" },
            startAdornment: <AttachFileIcon />,
          }}
        />
        {csvFields && (
          <table>
            <thead>
              <tr>
                <th>Key</th>
                <th>CSV</th>
                <th>Editor</th>
              </tr>
            </thead>
            <tbody>
              {csvFields.map((csvField, i) => (
                <tr key={i}>
                  <td>
                    <ToggleButton
                      sx={{ padding: 0, width: "40px", height: "40px" }}
                      value="isKey"
                      selected={csvField.isKey}
                      onChange={() => {
                        setCsvFields(
                          produce((fields) => {
                            fields![i].isKey = !fields![i].isKey;
                          })
                        );
                      }}
                    >
                      {csvField.isKey && <KeyIcon />}
                    </ToggleButton>
                  </td>
                  <td>{csvField.csvName}</td>
                  <td css={{ width: "100%" }}>
                    <Autocomplete
                      options={hotFields}
                      value={csvField.hotMapping}
                      onChange={(event, value) =>
                        setCsvFields(
                          produce((fields) => {
                            fields![i].hotMapping = value;
                          })
                        )
                      }
                      getOptionLabel={(field) => field.name}
                      renderInput={(params) => <TextField {...params} />}
                      renderOption={(props, option) => (
                        <li
                          {...props}
                          css={{
                            fontWeight:
                              option.uuid === "itemId" ? "bold" : undefined,
                          }}
                        >
                          {option.name}
                        </li>
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          disabled={!file || !csvFields}
          onClick={() =>
            onSubmit(file!, {
              delimiter: delimiterState.delimiter,
              fields: csvFields!.filter((csvField) => !!csvField.hotMapping),
            })
          }
        >
          Merge
        </Button>
      </DialogActions>
    </Dialog>
  );
}
