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
  Settings as IconGear,
} from "@mui/icons-material";
import { MuiFileInput } from "mui-file-input";
import { useEffect, useMemo, useState } from "react";
import { DelimiterMenu, DelimiterState } from "./DelimiterMenu";
import { TableStructure } from "src/structure";
import { useCsvHeaders } from "./hooks";
import { produce } from "immer";

interface CsvField {
  isKey: boolean;
  hotName: string;
  hotMapping: HotField | null;
}

type HotFieldKind = "special" | "property";

interface HotField {
  name: string;
  propPath: string;
  kind: HotFieldKind;
}

export function ImportDialog({
  onClose,
  tableStructure,
}: {
  onClose(): void;
  tableStructure: TableStructure<string>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [delimiterState, setDelimiterState] = useState<DelimiterState>({
    delimiter: ",",
    custom: false,
  });

  const headers = useCsvHeaders(file, delimiterState.delimiter);
  const [csvFields, setCsvFields] = useState<CsvField[] | null>(null);
  useEffect(() => {
    setCsvFields(
      headers
        ? headers.map((header) => ({
            isKey: false,
            hotName: header,
            hotMapping: null,
          }))
        : null
    );
  }, [headers]);

  const hotFields = useMemo<HotField[]>(
    () => [
      { name: "itemID", propPath: "itemID", kind: "special" },
      { name: "label", propPath: "label.value", kind: "special" },
      ...tableStructure.fields.map<HotField>((field) => ({
        name: field.name,
        propPath: `properties.${field.property}.value`,
        kind: "property",
      })),
    ],
    [tableStructure]
  );

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Import CSV</DialogTitle>
      <DialogContent>
        <DelimiterMenu value={delimiterState} onChange={setDelimiterState} />
        <MuiFileInput
          value={file}
          onChange={setFile}
          placeholder="Attach File"
          InputProps={{
            inputProps: { accept: "text/csv" },
            startAdornment: <AttachFileIcon />,
          }}
        />
        <table>
          <tbody>
            {csvFields &&
              csvFields.map((csvField, i) => (
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
                  <td>{csvField.hotName}</td>
                  <td css={{ width: "100%" }}>
                    <Autocomplete
                      options={hotFields}
                      getOptionLabel={(field) => field.name}
                      renderInput={(params) => <TextField {...params} />}
                      renderOption={(props, option) => (
                        <li {...props}>
                          {option.kind === "special" && <IconGear />}
                          {option.name}
                        </li>
                      )}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </DialogContent>
      <DialogActions>
        <Button>Merge</Button>
      </DialogActions>
    </Dialog>
  );
}
