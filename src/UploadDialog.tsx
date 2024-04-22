import {
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";

export default function UploadDialog({
  description,
  error,
  onClose,
}: {
  description: string;
  error?: Error | null;
  onClose?: () => void;
}) {
  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>{description}</DialogTitle>
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
