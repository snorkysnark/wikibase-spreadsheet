import { useRef } from "react";
import { EntityType } from "src/wikibase";
import { EntitySearch, HasId } from "./EntitySearch";
import { TextField } from "@mui/material";

export interface NamedItemValue {
  item: string | null;
  name: string;
}

export function NamedItem(props: {
  type: EntityType;
  value: NamedItemValue;
  onChange(value: NamedItemValue): void;
  extraOptions?: HasId[];
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
        value={props.value.item}
        onChange={(item) =>
          props.onChange({
            item: item && item.data.id,
            name: item?.data.label ?? item?.data.id ?? props.value.name,
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
          props.onChange({
            item: props.value.item,
            name: event.target.value,
          })
        }
      />
    </div>
  );
}
