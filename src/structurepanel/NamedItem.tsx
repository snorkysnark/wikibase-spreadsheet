import { useRef } from "react";
import { EntityType } from "src/wikibase";
import { EntitySearch, MinimalEntityData } from "./EntitySearch";
import { TextField } from "@mui/material";
import { produce } from "immer";

export interface NamedEntityValue {
  id: string | null;
  name: string;
  datatype?: string;
}

export function NamedEntity(props: {
  type: EntityType;
  value: NamedEntityValue;
  onChange(value: NamedEntityValue): void;
  extraOptions?: MinimalEntityData[];
}) {
  const textFieldRef = useRef<HTMLDivElement>(null);

  return (
    <div css={{ display: "flex", paddingTop: "0.5em", flex: "1" }}>
      <EntitySearch
        sx={{ flex: "1" }}
        type={props.type}
        extraOptions={props.extraOptions}
        popperWidth={(width) =>
          width + (textFieldRef.current?.clientWidth || 0)
        }
        value={props.value.id}
        onChange={(entity) =>
          props.onChange({
            id: entity && entity.data.id,
            name: entity?.data.label ?? entity?.data.id ?? props.value.name,
            datatype: entity?.data.datatype,
          })
        }
      />
      <TextField
        sx={{ flex: "2" }}
        label="Name"
        fullWidth
        ref={textFieldRef}
        value={props.value.name}
        onChange={(event) =>
          props.onChange(
            produce(props.value, (value) => {
              value.name = event.target.value;
            })
          )
        }
      />
    </div>
  );
}
