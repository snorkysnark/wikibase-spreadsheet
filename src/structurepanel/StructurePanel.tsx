import { produce } from "immer";
import ChooseInstanceProp from "./ChooseInstanceProp";
import NamedItem, { NamedItemValue } from "./NamedItem";
import { useMemo, useState } from "react";
import { TableField } from "src/structure";
import { Button, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function StructurePanel() {
  const [instanceProp, setInstanceProp] = useState<string | null>(null);
  const [parentInfo, setParentInfo] = useState<NamedItemValue>({
    id: null,
    name: "",
  });

  const [fields, setFields] = useState<TableField<string | null>[]>([]);
  const nextFieldId = useMemo(() => {
    let max = 0;
    for (const field of fields) {
      if (field.id > max) max = field.id;
    }
    return max + 1;
  }, [fields]);

  function swapField(from: number, to: number) {
    if (from >= 0 && from < fields.length && to >= 0 && to < fields.length) {
      setFields(
        produce((fields) => {
          const tmp = fields[to];
          fields[to] = fields[from];
          fields[from] = tmp;
        })
      );
    }
  }

  return (
    <div>
      <ChooseInstanceProp
        value={instanceProp || null}
        onChange={setInstanceProp}
      />
      <NamedItem value={parentInfo} onChange={setParentInfo} />
      <hr className="bg-gray-400 h-px border-0 my-2" />
      <ul>
        {fields.map((field, i) => (
          <li key={field.id}>
            <div className="flex items-center">
              <button className="w-4" onClick={() => swapField(i, i - 1)}>
                /\
              </button>
              <button className="w-4" onClick={() => swapField(i, i + 1)}>
                \/
              </button>
              <div className="flex-1">
                <NamedItem
                  type="property"
                  label="Prop ID"
                  value={{ id: field.property, name: field.name }}
                  onChange={(newValue) =>
                    setFields(
                      produce((fields) => {
                        fields[i].property = newValue.id;
                        fields[i].name = newValue.name;
                      })
                    )
                  }
                />
              </div>

              <IconButton
                aria-label="delete"
                onClick={() =>
                  setFields([
                    ...fields.slice(undefined, i),
                    ...fields.slice(i + 1),
                  ])
                }
              >
                <DeleteIcon />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>
      <Button
        onClick={() =>
          setFields([...fields, { id: nextFieldId, property: null, name: "" }])
        }
      >
        Add
      </Button>
    </div>
  );
}
