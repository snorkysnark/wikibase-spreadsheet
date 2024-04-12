import {
  Alert,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  TableModifications,
  UploadTask,
  applyModificationsTasks,
} from "./tableContent";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "react-query";

export default function UploadDialog({
  modifications,
  isInstanceProp,
  parentId,
  onFinished,
}: {
  modifications: TableModifications;
  isInstanceProp: string;
  parentId: string;
  onFinished: () => void;
}) {
  const tasks = useRef<UploadTask[]>([]);
  const nextTask = useCallback(() => {
    const next = tasks.current.pop();
    if (next) {
      setTaskDescription(next.description);
      currentTask.mutate(next);
    } else {
      onFinished();
    }
  }, []);

  useEffect(() => {
    tasks.current = applyModificationsTasks(
      modifications,
      isInstanceProp,
      parentId
    );
    nextTask();
  }, [modifications, isInstanceProp, parentId]);

  const currentTask = useMutation<void, Error, UploadTask>(
    (task: UploadTask) => task.run(),
    {
      onSuccess: nextTask,
    }
  );
  const [taskDescription, setTaskDescription] = useState("");

  return (
    <Dialog
      open={true}
      onClose={() => {
        // Only allow quitting if tasks failed
        if (currentTask.isError) onFinished();
      }}
    >
      <DialogTitle>{taskDescription}</DialogTitle>
      <DialogContent>
        {currentTask.isLoading && <CircularProgress />}
        {currentTask.isError && (
          <Alert severity="error">{currentTask.error.message}</Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
