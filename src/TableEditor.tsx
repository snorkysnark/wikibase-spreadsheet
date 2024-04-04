import { HotTable } from "@handsontable/react";
import { TableStructure } from "./structure";

export default function TableEditor({
  tableStructure,
}: {
  tableStructure: TableStructure<string>;
}) {
  return (
    <HotTable
      colHeaders={tableStructure.fields.map((field) => field.name)}
      rowHeaders={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
}
