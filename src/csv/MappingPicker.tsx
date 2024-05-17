import { IconButton, MenuItem, Select, TextField } from "@mui/material";
import { Save, SaveAs, Delete } from "@mui/icons-material";
import {
  CsvMapping,
  CsvMappingActions,
  CsvMappingPartial,
  OrderedMap,
  map,
} from "src/structure";
import { useLayoutEffect, useState } from "react";

export default function MappingPicker({
  value,
  onChange,
  csvMappings,
  alterMappings,
  makeUpdated,
}: {
  value: CsvMapping | null;
  onChange(mapping: CsvMapping | null): void;
  csvMappings: OrderedMap<CsvMapping>;
  alterMappings: CsvMappingActions;
  makeUpdated(): CsvMappingPartial;
}) {
  // Uuid to be selected on next render
  const [selectUuid, setSelectUuid] = useState<string | null>(null);
  useLayoutEffect(() => {
    if (selectUuid) {
      onChange(csvMappings.byUuid[selectUuid]);
      setSelectUuid(null);
    }
  }, [csvMappings, onChange, selectUuid]);

  const [saveAsMode, setSaveAsMode] = useState(false);
  if (saveAsMode) {
    return (
      <TextField
        sx={{ width: "100%" }}
        autoFocus
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;

          const name = (event.target as HTMLInputElement).value;
          if (name) {
            const updated = makeUpdated();
            updated.name = name;

            setSelectUuid(alterMappings.add(updated));
            setSaveAsMode(false);
          }
        }}
        onBlur={() => setSaveAsMode(false)}
      />
    );
  }

  return (
    <div css={{ display: "flex", alignItems: "center" }}>
      <Select
        sx={{ flex: "1" }}
        variant="outlined"
        value={value ? value.uuid : null}
        onChange={(event) => {
          const uuid = event.target.value;
          onChange(uuid ? csvMappings.byUuid[uuid] : null);
        }}
      >
        {map(csvMappings, (mapping, i) => (
          <MenuItem key={mapping.uuid} value={mapping.uuid}>
            {mapping.name}
          </MenuItem>
        ))}
      </Select>
      {value && (
        <>
          <IconButton
            aria-label="delete mapping"
            onClick={() => {
              alterMappings.delete(value.uuid);
              onChange(null);
            }}
          >
            <Delete />
          </IconButton>
          <IconButton
            aria-label="save mapping as"
            onClick={() => setSaveAsMode(true)}
          >
            <SaveAs />
          </IconButton>
        </>
      )}
      <IconButton
        aria-label="save mapping"
        onClick={() => {
          if (value) {
            alterMappings.update(value.uuid, makeUpdated());
            setSelectUuid(value.uuid);
          } else {
            setSaveAsMode(true);
          }
        }}
      >
        <Save />
      </IconButton>
    </div>
  );
}
