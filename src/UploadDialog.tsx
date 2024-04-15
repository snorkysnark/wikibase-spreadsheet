import {
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";

export default function UploadDialog({
  error,
  onClose,
}: {
  error?: Error | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={true}
      onClose={() => {
        if (error) onClose();
      }}
    >
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
