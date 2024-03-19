import { useRef } from "react";
import ItemSearch from "./ItemSearch";
import { TextField } from "@mui/material";

export interface NamedItemValue {
  id: string | null;
  name: string;
}

export default function NamedItem({
  value: { id, name },
  onChange,
}: {
  value: NamedItemValue;
  onChange: (value: NamedItemValue) => void;
}) {
  const itemInput = useRef<HTMLDivElement>(null);
  const nameInput = useRef<HTMLDivElement>(null);

  return (
    <div className="flex mt-2">
      <ItemSearch
        ref={itemInput}
        type="item"
        label="Item ID"
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
