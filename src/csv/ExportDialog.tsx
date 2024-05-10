import {
  Dialog,
  DialogActions,
  DialogTitle,
  Button,
  DialogContent,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { FormEvent } from "react";
import { DelimiterMenu } from "./DelimiterMenu";

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
            headerRow?: string;
            itemIds?: string;
          };
          onSubmit({
            delimiter: formData.delimiter,
            headerRow: !!formData.headerRow,
            itemIds: !!formData.itemIds,
          });
        },
      }}
    >
      <DialogTitle>Export CSV</DialogTitle>
      <DialogContent>
        <DelimiterMenu />
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
