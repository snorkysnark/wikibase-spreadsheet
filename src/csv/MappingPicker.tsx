import { IconButton, MenuItem, Select, TextField } from "@mui/material";
import { Save, SaveAs, Delete } from "@mui/icons-material";
import { CsvMapping, OrderedMap, map } from "src/structure";
import { useState } from "react";

export default function MappingPicker({
  currentUuid,
  onChange,
  save,
  saveAs,
  deleteCurrent,
  csvMappings,
}: {
  currentUuid: string | null;
  onChange(uuid: string | null): void;
  save(): void;
  saveAs(name: string): void;
  deleteCurrent(): void;
  csvMappings: OrderedMap<CsvMapping>;
}) {
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
            saveAs(name);
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
        value={currentUuid}
        onChange={(event) => onChange(event.target.value)}
      >
        {map(csvMappings, (mapping, i) => (
          <MenuItem key={mapping.uuid} value={mapping.uuid}>
            {mapping.name}
          </MenuItem>
        ))}
      </Select>
      {currentUuid && (
        <>
          <IconButton aria-label="delete mapping" onClick={deleteCurrent}>
            <Delete />
          </IconButton>
          <IconButton aria-label="save mapping as">
            <SaveAs />
          </IconButton>
        </>
      )}
      <IconButton
        aria-label="save mapping"
        onClick={() => {
          if (currentUuid) {
            save();
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
