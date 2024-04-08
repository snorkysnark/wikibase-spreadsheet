import { HotTable } from "@handsontable/react";
import { TableStructure } from "./structure";
import { TableRows } from "./tableContent";

export default function TableEditor({
  tableStructure,
  data,
}: {
  tableStructure: TableStructure<string>;
  data: TableRows;
}) {
  return (
    <HotTable
      colHeaders={tableStructure.fields.map((field) => field.name)}
      rowHeaders={data.rowHeaders}
      data={data.rows}
      licenseKey="non-commercial-and-evaluation"
    />
  );
}
