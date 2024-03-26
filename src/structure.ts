export interface StructureSettings {
  isInstanceProperty: string | null;
  tables: TableStructure<string>[];
}

export interface TableStructurePartial<WikidataID> {
  name: string;
  parentItem: WikidataID;
  fields: TableField<WikidataID>[];
}

export interface TableStructure<WikidataID>
  extends TableStructurePartial<WikidataID> {
  uuid: string;
}

export interface TableField<WikidataID> {
  uuid: string;
  property: WikidataID;
  name: string;
}
