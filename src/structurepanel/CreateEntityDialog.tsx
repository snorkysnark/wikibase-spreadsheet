import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { FormEvent, useEffect } from "react";
import { useMutation } from "react-query";
import { EntityType, editEntity, entityDataEn } from "src/wikibase";

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
  const entityMutation = useMutation(editEntity);
  useEffect(() => {
    if (entityMutation.isSuccess) {
      const {
        type,
        id,
        labels: {
          en: { value: name },
        },
      } = entityMutation.data.entity;

      handleExit({ type, id, name });
    }
  });

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
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button type="submit">Create</Button>
      </DialogActions>
    </Dialog>
  );
}
