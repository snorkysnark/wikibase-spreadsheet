import { useRef } from "react";
import ItemSearch from "./ItemSearch";
import { TextField } from "@mui/material";
import { EntityType } from "src/wikibase";

export interface NamedItemValue {
  id: string | null;
  name: string;
}

export default function NamedItem({
  value: { id, name },
  onChange,
  type = "item",
  label = "Item ID",
}: {
  value: NamedItemValue;
  onChange: (value: NamedItemValue) => void;
  type?: EntityType;
  label?: string;
}) {
  const itemInput = useRef<HTMLDivElement>(null);
  const nameInput = useRef<HTMLDivElement>(null);

  return (
    <div className="flex mt-2">
      <ItemSearch
        ref={itemInput}
        type={type}
        label={label}
        value={id ? { id } : null}
        onChange={(item) =>
          onChange({ id: item && item.id, name: item?.label || name })
        }
        popperWidth={() =>
          itemInput.current && nameInput.current
            ? itemInput.current.clientWidth + nameInput.current.clientWidth
            : 0
        }
      />
      <TextField
        ref={nameInput}
        label="Name"
        fullWidth
        value={name}
        onInput={(event) =>
          onChange({
            id: id,
            name: (event.target as HTMLInputElement).value,
          })
        }
      />
    </div>
  );
}
