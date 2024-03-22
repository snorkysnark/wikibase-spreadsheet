import NamedItem, { NamedItemValue } from "./NamedItem";
import { useState } from "react";
import { Typography } from "@mui/material";
import ItemSearch from "./ItemSearch";

export default function StructurePanel() {
  const [instanceProp, setInstanceProp] = useState<string | null>(null);
  const [parentInfo, setParentInfo] = useState<NamedItemValue>({
    id: null,
    name: "",
  });

  return (
    <>
      <div css={{ display: "flex", paddingTop: "1em" }}>
        <Typography variant="h5">Is instance(</Typography>
        <ItemSearch
          type="property"
          label="Property ID"
          value={instanceProp}
          onChange={(value) => setInstanceProp(value && value.id)}
          sx={{ flex: "1" }}
        />
        <Typography variant="h5">) of</Typography>
      </div>

      <NamedItem value={parentInfo} onChange={setParentInfo} />
    </>
  );
}
