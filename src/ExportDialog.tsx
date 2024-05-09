import {
  Dialog,
  DialogActions,
  DialogTitle,
  Button,
  DialogContent,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormHelperText,
} from "@mui/material";
import { FormEvent, useState } from "react";

export interface ExportParameters {
  delimiter: string;
  headerRow: boolean;
  itemIds: boolean;
}

export function ExportDialog({
  onClose,
  onSubmit,
}: {
  onClose(): void;
  onSubmit(params: ExportParameters): void;
}) {
  const [delimiterOption, setDelimiterOption] = useState(",");

  return (
    <Dialog
      open={true}
      onClose={onClose}
      PaperProps={{
        component: "form",
        onSubmit: (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();

          const formData = Object.fromEntries(
            new FormData(event.currentTarget).entries()
          ) as {
            delimiter: string;
            customDelimiter?: string;
            headerRow?: string;
            itemIds?: string;
          };
          onSubmit({
            delimiter:
              formData.delimiter === "other"
                ? formData.customDelimiter!
                : formData.delimiter,
            headerRow: !!formData.headerRow,
            itemIds: !!formData.itemIds,
          });
        },
      }}
    >
      <DialogTitle>Export CSV</DialogTitle>
      <DialogContent>
        <FormHelperText>Delimiter</FormHelperText>
        <RadioGroup
          row
          name="delimiter"
          value={delimiterOption}
          onChange={(event) => setDelimiterOption(event.target.value)}
        >
          <FormControlLabel control={<Radio />} label="Comma" value="," />
          <FormControlLabel control={<Radio />} label="Tab" value={"\t"} />
          <FormControlLabel control={<Radio />} label="Other" value="other" />
        </RadioGroup>
        {delimiterOption === "other" && (
          <TextField name="customDelimiter" sx={{ display: "block" }} />
        )}
        <FormControlLabel
          name="headerRow"
          control={<Checkbox defaultChecked />}
          label="Header row"
        />
        <FormControlLabel
          name="itemIds"
          control={<Checkbox />}
          label="Item IDs"
        />
      </DialogContent>
      <DialogActions>
        <Button type="submit">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
