import {
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";

export default function UploadDialog({ error }: { error?: Error | null }) {
  return (
    <Dialog open={true}>
      <DialogTitle>Uploading</DialogTitle>
      <DialogContent>
        {error ? (
          <Alert severity="error">{error.message}</Alert>
        ) : (
          <CircularProgress />
        )}
      </DialogContent>
    </Dialog>
  );
}
