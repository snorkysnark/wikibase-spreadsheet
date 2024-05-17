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
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  DelimiterMenu,
  DelimiterState,
  parseDelimiterState,
} from "./DelimiterMenu";
import {
  CsvMapping,
  CsvMappingActions,
  CsvMappingPartial,
  FieldMapping,
  OrderedMap,
  TableField,
  TableStructure,
} from "src/structure";
import { useCsvHeaders } from "./hooks";
import { produce } from "immer";
import MappingPicker from "./MappingPicker";

export interface ImportField<AllowNull extends boolean = false> {
  isKey: boolean;
  csvName: string;
  hotMapping: AllowNull extends true ? TableField | null : TableField;
}

export interface ImportParameters {
  delimiter: string;
  fields: ImportField[];
}

const itemIdPseudoField = {
  uuid: "itemId",
  name: "itemId",
  property: "itemId",
};

function loadMappingFields(
  hotFields: TableField[],
  mapping: CsvMapping | null
) {
  const uuidToField = useMemo(() => {
    const map = new Map<string, TableField>();
    for (const field of hotFields) map.set(field.uuid, field);
    return map;
  }, [hotFields]);

  const headerToCsvField = useMemo(() => {
    const map = new Map<string, ImportField<boolean>>();
    if (mapping) {
      for (const { isKey, csvField, fieldUuid } of mapping.pairs) {
        map.set(csvField, {
          isKey: isKey,
          csvName: csvField,
          hotMapping: uuidToField.get(fieldUuid) ?? null,
        });
      }
    }
    return map;
  }, [mapping, uuidToField]);

  return headerToCsvField;
}

function dumpMappingFields(csvFields: ImportField<boolean>[]): FieldMapping[] {
  return csvFields.map(({ isKey, csvName, hotMapping }) => ({
    isKey,
    fieldUuid: hotMapping!.uuid,
    csvField: csvName,
  }));
}

export function ImportDialog({
  onClose,
  onSubmit,
  tableStructure,
  csvMappings,
  alterMappings,
}: {
  onClose(): void;
  onSubmit(file: File, params: ImportParameters): void;
  tableStructure: TableStructure;
  csvMappings: OrderedMap<CsvMapping>;
  alterMappings: CsvMappingActions;
}) {
  const [mapping, setMapping] = useState<CsvMapping | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [delimiterState, setDelimiterState] = useState<DelimiterState>({
    delimiter: ",",
    custom: false,
  });

  useEffect(() => {
    if (mapping) setDelimiterState(parseDelimiterState(mapping.delimiter));
  }, [mapping]);

  const headers = useCsvHeaders(file, delimiterState.delimiter);
  const [csvFields, setCsvFields] = useState<ImportField<boolean>[] | null>(
    null
  );

  const hotFields = useMemo<TableField[]>(
    () => [itemIdPseudoField, ...tableStructure.fields],
    [tableStructure]
  );
  const fieldMapper = loadMappingFields(hotFields, mapping);

  useLayoutEffect(() => {
    setCsvFields(
      headers
        ? headers.map((header) => {
            return (
              fieldMapper.get(header) ?? {
                isKey: false,
                csvName: header,
                hotMapping: null,
              }
            );
          })
        : null
    );
  }, [headers, fieldMapper]);

  const makeUpdated = (current: CsvMappingPartial | null) => {
    if (!csvFields) return null;

    return {
      name: current?.name || "",
      delimiter: delimiterState.delimiter,
      pairs: dumpMappingFields(csvFields),
    };
  };

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Import CSV</DialogTitle>
      <DialogContent>
        <MappingPicker
          value={mapping}
          onChange={setMapping}
          csvMappings={csvMappings}
          alterMappings={alterMappings}
          makeUpdated={makeUpdated}
        />
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
