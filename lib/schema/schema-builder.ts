import Entity from "../entity/entity";
import Schema from "./schema";
import { StringArrayField, FieldDefinition, StringField } from './schema-definitions';

export default class SchemaBuilder<TEntity extends Entity> {

  private schema: Schema<TEntity>;

  constructor(schema: Schema<TEntity>) {
    this.schema = schema;
  }

  get redisSchema(): string[] {
    if (this.schema.dataStructure === 'JSON') return this.buildJsonSchema()
    if (this.schema.dataStructure === 'HASH') return this.buildHashSchema();
    throw Error("'FOO' in an invalid data structure. Valid data structures are 'HASH' and 'JSON'.");
  }

  private buildHashSchema() : string[] {
    let redisSchema: string[] = [];
    for (let field in this.schema.definition) {
      redisSchema.push(...this.buildHashSchemaEntry(field));
    }
    return redisSchema;
  }
  
  private buildJsonSchema(): string[] {
    let redisSchema: string[] = [];
    for (let field in this.schema.definition) {
      redisSchema.push(...this.buildJsonSchemaEntry(field));
    }
    return redisSchema;
  }

  private buildHashSchemaEntry(field: string) : string[] {
    let schemaEntry: string[] = [];

    let fieldDef: FieldDefinition = this.schema.definition[field];
    let fieldType = fieldDef.type;
    let fieldAlias = fieldDef.alias ?? field;

    schemaEntry.push(fieldAlias)

    if (fieldType === 'date') schemaEntry.push('NUMERIC');
    if (fieldType === 'boolean') schemaEntry.push('TAG');
    if (fieldType === 'number') schemaEntry.push('NUMERIC');
    if (fieldType === 'point') schemaEntry.push('GEO');
    if (fieldType === 'string[]') schemaEntry.push('TAG', 'SEPARATOR', (fieldDef as StringArrayField).separator ?? '|');
    if (fieldType === 'string') schemaEntry.push('TAG', 'SEPARATOR', (fieldDef as StringField).separator ?? '|');
    if (fieldType === 'text') schemaEntry.push('TEXT');

    return schemaEntry;
  }

  private buildJsonSchemaEntry(field: string): string[] {
    let schemaEntry: string[] = [];
  
    let fieldDef: FieldDefinition = this.schema.definition[field];
    let fieldType = fieldDef.type;
    let fieldAlias = fieldDef.alias ?? field;
    let fieldPath = `\$.${fieldAlias}${fieldType === 'string[]' ? '[*]' : ''}`;

    schemaEntry.push(fieldPath, 'AS', fieldAlias);

    if (fieldType === 'boolean') schemaEntry.push('TAG');
    if (fieldType === 'number') schemaEntry.push('NUMERIC');
    if (fieldType === 'point') schemaEntry.push('GEO');
    if (fieldType === 'date') schemaEntry.push('NUMERIC');
    if (fieldType === 'string[]') schemaEntry.push('TAG');
    if (fieldType === 'string') schemaEntry.push('TAG', 'SEPARATOR', (fieldDef as StringField).separator ?? '|');
    if (fieldType === 'text') schemaEntry.push('TEXT');

    return schemaEntry;
  }
}

