import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
  datatype: string;
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

          const { label, description, datatype } = Object.fromEntries(
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
                datatype,
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
        <FormControl variant="filled" fullWidth sx={{ marginTop: "1em" }}>
          <InputLabel id="label-datatype">Datatype</InputLabel>
          <Select
            labelId="label-datatype"
            label="Datatype"
            name="datatype"
            defaultValue="string"
          >
            <MenuItem value="string">String</MenuItem>
            <MenuItem value="quantity">Quantity</MenuItem>
          </Select>
        </FormControl>
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
