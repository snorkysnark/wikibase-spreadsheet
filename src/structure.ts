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
  uuid: string;
  property: WikidataID;
  name: string;
}
