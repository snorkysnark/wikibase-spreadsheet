import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { FormEvent } from "react";
import { useMutation } from "react-query";
import {
  EditEntityData,
  EditEntityParams,
  EntityType,
  WikibaseError,
  editEntity,
  entityDataEn,
} from "src/wikibase";

function BlockTextField(props: Parameters<typeof TextField>[0]) {
  return (
    <TextField
      variant="filled"
      sx={{ display: "block" }}
      fullWidth
      {...props}
    />
  );
}

interface FormValues {
  label: string;
  description: string;
}

export default function CreateEntityDialog({
  type: entityType,
  handleExit,
  defaultName,
}: {
  type: EntityType;
  handleExit: (
    entityData?: { type: EntityType; id: string; name: string } | null
  ) => void;
  defaultName?: string;
}) {
  const entityMutation = useMutation<EditEntityData, Error, EditEntityParams>(
    editEntity,
    {
      onSuccess: (data) => {
        const {
          type,
          id,
          labels: {
            en: { value: name },
          },
        } = data.entity;

        handleExit({ type, id, name });
      },
    }
  );

  const closeDialog = () => handleExit(null);

  return (
    <Dialog
      open={true}
      onClose={closeDialog}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: "form",
        onSubmit: (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();

          const { label, description } = Object.fromEntries(
            new FormData(event.currentTarget)
          ) as unknown as FormValues;
          if (label) {
            entityMutation.mutate({
              new: entityType,
              data: {
                ...entityDataEn({
                  labels: label,
                  ...(description && { descriptions: description }),
                }),
                datatype: "string",
              },
            });
          }
        },
      }}
    >
      <DialogTitle>
        Create {entityType[0].toUpperCase() + entityType.slice(1)}
      </DialogTitle>
      <DialogContent>
        <BlockTextField
          label="Label"
          name="label"
          required
          defaultValue={defaultName}
        />
        <BlockTextField
          label="Description"
          name="description"
          multiline
          minRows={2}
        />
        {entityMutation.error && (
          <Alert severity="error">
            {entityMutation.error instanceof WikibaseError
              ? entityMutation.error.messages.map((message) => <p>{message}</p>)
              : entityMutation.error.message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button type="submit">Create</Button>
      </DialogActions>
    </Dialog>
  );
}
