export interface StructureSettings {
  isInstanceProperty: string | null;
  tables: TableStructure[];
}

type MaybeNull<T, AllowNull extends boolean> = AllowNull extends true
  ? T | null
  : T;

export interface TableStructurePartial<AllowNull extends boolean = false> {
  name: string;
  parentItem: MaybeNull<string, AllowNull>;
  fields: TableField<AllowNull>[];
}

export interface TableStructure<AllowNull extends boolean = false>
  extends TableStructurePartial<AllowNull> {
  uuid: string;
}

export interface TableField<AllowNull extends boolean = false> {
  uuid: string;
  property: MaybeNull<string, AllowNull>;
  name: string;
}
