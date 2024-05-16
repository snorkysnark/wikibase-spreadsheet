import { useRef } from "react";
import { EntityType } from "src/wikibase";
import ItemSearch from "./ItemSearch";
import { TextField } from "@mui/material";

export interface NamedItemValue {
  item: string | null;
  name: string;
}

export function NamedItem(props: {
  type: EntityType;
  value: NamedItemValue;
  onChange(value: NamedItemValue): void;
}) {
  const textFieldRef = useRef<HTMLDivElement>(null);

  return (
    <div css={{ display: "flex", paddingTop: "0.5em", flex: "1" }}>
      <ItemSearch
        sx={{ width: "10em" }}
        type={props.type}
        popperWidth={(width) =>
          width + (textFieldRef.current?.clientWidth || 0)
        }
        value={props.value.item}
        onChange={(item) =>
          props.onChange({
            item: item && item.id,
            name: item?.label ?? item?.id ?? props.value.name,
          })
        }
      />
      <TextField
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
