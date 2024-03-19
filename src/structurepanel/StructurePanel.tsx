import { useLocalStorage } from "react-use";
import ChooseInstanceProp from "./ChooseInstanceProp";
import NamedItem, { NamedItemValue } from "./NamedItem";
import { useState } from "react";

export default function StructurePanel() {
  const [instanceProp, setInstanceProp] = useLocalStorage<string | null>(
    "is-instance-prop"
  );

  const [parentInfo, setParentInfo] = useState<NamedItemValue>({
    id: null,
    name: "",
  });

  return (
    <div>
      <ChooseInstanceProp
        value={instanceProp || null}
        onChange={setInstanceProp}
      />
      <NamedItem value={parentInfo} onChange={setParentInfo} />
      <hr className="bg-gray-400 h-px border-0 my-2" />
    </div>
  );
}
