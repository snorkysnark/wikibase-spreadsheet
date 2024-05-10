import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { MuiFileInput } from "mui-file-input";
import { useEffect, useState } from "react";
import { parse as parseCsv } from "csv-parse/browser/esm/sync";
import { DelimiterMenu, DelimiterState } from "./DelimiterMenu";

export function ImportDialog({ onClose }: { onClose(): void }) {
  const [file, setFile] = useState<File | null>(null);
  const [delimiterState, setDelimiterState] = useState<DelimiterState>({
    delimiter: ",",
    custom: false,
  });

  const [headers, setHeaders] = useState<string[] | null>(null);
  useEffect(() => console.log(headers), [headers]);

  useEffect(() => {
    if (!file) {
      setHeaders(null);
      return;
    }

    let valid = true;

    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      if (!valid) return;

      const csv = reader.result as string;
      const firstLineEnd = csv.indexOf("\n");
      setHeaders(
        parseCsv(
          csv.substring(0, firstLineEnd >= 0 ? firstLineEnd : undefined),
          { delimiter: delimiterState.delimiter }
        )[0]
      );
    };

    return () => {
      valid = false;
    };
  }, [file, delimiterState.delimiter]);

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
        <ul>
          {headers && headers.map((header, i) => <li key={i}>{header}</li>)}
        </ul>
      </DialogContent>
      <DialogActions>
        <Button>Merge</Button>
      </DialogActions>
    </Dialog>
  );
}
