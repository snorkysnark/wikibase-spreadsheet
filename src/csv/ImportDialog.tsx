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
import { TableStructure } from "src/structure";
import { useAsync } from "@react-hookz/web";

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

  const [{ result: headers }, headerAction] = useAsync<
    string[] | null,
    [File | null, string]
  >(async (file: File | null, delimiter: string) => {
    if (!file) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => {
        const csv = reader.result as string;
        const firstLineEnd = csv.indexOf("\n");
        resolve(
          parseCsv(
            csv.substring(0, firstLineEnd >= 0 ? firstLineEnd : undefined),
            { delimiter: delimiter }
          )[0]
        );
      };
    });
  }, null);
  useEffect(() => {
    headerAction.execute(file, delimiterState.delimiter);
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
