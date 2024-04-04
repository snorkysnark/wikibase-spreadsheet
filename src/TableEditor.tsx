import { HotTable } from "@handsontable/react";
import { TableStructure } from "./structure";
import { sparqlQuery } from "./wikibase";
import { useQuery } from "react-query";
import { useEffect } from "react";
import { Alert } from "@mui/material";

interface TableRows {
  rowHeaders: string[];
  rows: string[][];
}

async function queryRows(
  isInstanceProp: string,
  tableStructure: TableStructure<string>
): Promise<TableRows> {
  const result = await sparqlQuery({
    isInstanceProp,
    parent: tableStructure.parentItem,
    properties: tableStructure.fields.map((field) => field.property),
  });

  const rowHeaders = [];
  const rows = [];

  const bindingNames: string[] = result.head.vars;

  for (const binding of result.results.bindings) {
    const fullRow = bindingNames.map((name) => binding[name].value);
    const uri = fullRow[0];
    const row = fullRow.splice(1, fullRow.length);

    const uriMatch = /\/(\w+)$/.exec(uri);
    if (!uriMatch) {
      throw new Error("Unexpected uri: " + uri);
    }

    rowHeaders.push(uriMatch[1]);
    rows.push(row);
  }

  return { rowHeaders, rows };
}

export default function TableEditor({
  isInstanceProp,
  tableStructure,
}: {
  isInstanceProp: string;
  tableStructure: TableStructure<string>;
}) {
  const query = useQuery<TableRows, Error>(
    ["query", isInstanceProp, tableStructure],
    () => queryRows(isInstanceProp, tableStructure)
  );

  if (query.data) {
    return (
      <HotTable
        colHeaders={tableStructure.fields.map((field) => field.name)}
        rowHeaders={query.data.rowHeaders}
        data={query.data.rows}
        licenseKey="non-commercial-and-evaluation"
      />
    );
  } else {
    if (query.error)
      return <Alert severity="error">{query.error.message}</Alert>;

    return <></>;
  }
}
