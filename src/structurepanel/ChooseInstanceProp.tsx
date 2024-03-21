import ItemSearch from "./ItemSearch";
import DragHandle from "@mui/icons-material/DragHandle";

export default function ChooseInstanceProp(props: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex mt-2">
      <span className="shrink-0 text-xl">Is instance (</span>
      <ItemSearch
        type="property"
        label="Property ID"
        value={props.value ? { id: props.value } : null}
        onChange={(value) => {
          props.onChange(value && value.id);
        }}
        sx={{ display: "inline-block", flex: "1" }}
      />
      <span className="shrink-0 text-xl">) of</span>
    </div>
  );
}
