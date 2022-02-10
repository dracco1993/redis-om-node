import { EntityData } from '../entity/entity';
import { ArrayField, SchemaDefinition, GeoPoint } from "../schema/schema-definitions";
import { HashData } from '../client';

export default class HashConverter {
  private schemaDef: SchemaDefinition

  constructor(schemaDef: SchemaDefinition) {
    this.schemaDef = schemaDef;
  }

  toHashData(entityData: EntityData): HashData {
    let hashData: HashData = {};

    for (let field in this.schemaDef) {
      let value = entityData[field];
      if (value !== undefined) {
        let fieldDef = this.schemaDef[field];
        if (fieldDef.type === 'number') hashData[field] = value.toString();
        if (fieldDef.type === 'boolean') hashData[field] = value ? '1': '0';
        if (fieldDef.type === 'array') hashData[field] = (value as string[]).join(fieldDef.separator ?? '|');
        if (fieldDef.type === 'string') hashData[field] = value;
        if (fieldDef.type === 'date') hashData[field] = (value as Date).getTime().toString();
        if (fieldDef.type === 'geopoint') {
          let { longitude, latitude } = value as GeoPoint;
          hashData[field] = `${longitude},${latitude}`;
        }
      }
    }
    return hashData;
  }

  toEntityData(hashData: HashData): EntityData{

    let entityData: EntityData = {};

    for (let field in this.schemaDef) {
      let value = hashData[field];
      if (value !== undefined) {
        let fieldDef = this.schemaDef[field]
        if (fieldDef.type === 'number') this.addNumber(field, entityData, value);
        if (fieldDef.type === 'boolean') this.addBoolean(field, entityData, value);
        if (fieldDef.type === 'array') this.addArray(field, fieldDef as ArrayField, entityData, value);
        if (fieldDef.type === 'string') this.addString(field, entityData, value);
        if (fieldDef.type === 'date') this.addDate(field, entityData, value);
        if (fieldDef.type === 'geopoint') this.addGeoPoint(field, entityData, value);
      }
    }

    return entityData;
  }

  private addNumber(field: string, entityData: EntityData, value: string) {
    let parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) throw Error(`Non-numeric value of '${value}' read from Redis for number field '${field}'`);
    entityData[field] = Number.parseFloat(value);
  }

  private addBoolean(field: string, entityData: EntityData, value: string) {
    if (value === '0') {
      entityData[field] = false;
    } else if (value === '1') {
      entityData[field] = true;
    } else {
      throw Error(`Non-boolean value of '${value}' read from Redis for boolean field '${field}'`);
    }
  }

  private addArray(field: string, fieldDef: ArrayField, entityData: EntityData, value: string) {
    entityData[field] = value.split(fieldDef.separator ?? '|');
  }

  private addString(field: string, entityData: EntityData, value: string) {
    entityData[field] = value;
  }

  private addDate(field: string, entityData: EntityData, value: string) {
    let parsed = Number.parseInt(value);
    if (Number.isNaN(parsed)) throw Error(`Non-numeric value of '${value}' read from Redis for date field '${field}'`);
    let date = new Date();
    date.setTime(parsed);
    entityData[field] = date;
  }

  private addGeoPoint(field: string, entityData: EntityData, value: string) {
    let [ longitude, latitude ] = value.split(',').map(Number.parseFloat);
    entityData[field] = { longitude, latitude };
  }
}
