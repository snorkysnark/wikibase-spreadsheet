import { ButtonGroup, Divider, IconButton, Typography } from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import ItemSearch from "./ItemSearch";
import { TableStructure, TableStructurePartial } from "src/structure";

export default function StructurePanel(props: {
  isInstanceProperty: string | null;
  onChangeInstanceProperty: (value: string | null) => void;
  tableStructure: TableStructure | null;
  onChangeStucture: (tableStructure: TableStructurePartial) => void;
  onDelete: () => void;
}) {
  return (
    <div
      css={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div css={{ flex: "1" }}>
        <div
          css={{
            display: "flex",
            paddingTop: "0.5em",
          }}
        >
          <Typography variant="h5">Is instance(</Typography>
          <ItemSearch
            type="property"
            value={props.isInstanceProperty}
            onChange={(value) =>
              props.onChangeInstanceProperty(value && value.id)
            }
            sx={{ flex: "1" }}
          />
          <Typography variant="h5">) of</Typography>
        </div>
        <div css={{ display: "flex", alignItems: "center" }}>
          <IconButton aria-label="property settings" size="small">
            <MoreHoriz />
          </IconButton>
        </div>
        <Divider sx={{ marginY: "0.5em" }} />
      </div>

      <ButtonGroup variant="outlined" fullWidth></ButtonGroup>
    </div>
  );
}
