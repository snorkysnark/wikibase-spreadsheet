export interface StructureSettings {
  isInstanceProperty: string;
  tables: { [name: string]: TableStructure<string> };
}

export interface TableStructure<WikidataID> {
  name: string;
  parentItem: WikidataID;
  fields: TableField<WikidataID>[];
}

export interface TableField<WikidataID> {
  id: number;
  property: WikidataID;
  name: string;
}
