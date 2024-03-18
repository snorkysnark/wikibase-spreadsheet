import ItemSearch from "./ItemSearch";

export default function StructurePanel() {
  return (
    <div className="p-2">
      <div>
        Is instance (
        <ItemSearch
          type="property"
          sx={{ display: "inline-block" }}
          popperStyle={{
            width: "300px",
          }}
        />
        ) of
      </div>
    </div>
  );
}
