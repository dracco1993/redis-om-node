import { EntityData, EntityValue } from '../entity/entity';
import { JsonData, HashData } from '../client';
import { StringArrayField, SchemaDefinition, FieldDefinition, Point } from "../schema/schema-definitions";

class AbstractConverter {
  protected schemaDef: SchemaDefinition

  constructor(schemaDef: SchemaDefinition) {
    this.schemaDef = schemaDef;
  }
}

/** @internal */
export class HashConverter extends AbstractConverter {

  toHashData(entityData: EntityData): HashData {
    let hashData: HashData = {};
    for (let fieldName in this.schemaDef) {
      let entityValue = entityData[fieldName];
      let fieldDef = this.schemaDef[fieldName];
      let fieldType = fieldDef.type;
      if (entityValue !== undefined) hashData[fieldName] = toHashConverters[fieldType](entityValue, fieldDef);
    }
    return hashData;
  }

  toEntityData(hashData: HashData): EntityData{
    let entityData: EntityData = {};
    for (let fieldName in this.schemaDef) {
      let hashValue = hashData[fieldName];
      let fieldDef = this.schemaDef[fieldName]
      let fieldType = fieldDef.type;
      if (hashValue !== undefined) entityData[fieldName] = fromHashConverters[fieldType](hashValue, fieldDef)
    }
    return entityData;
  }
}

/** @internal */
export class JsonConverter extends AbstractConverter {

  toJsonData(entityData: EntityData): JsonData {
    let jsonData: JsonData = {};
    for (let fieldName in this.schemaDef) {
      let fieldValue = entityData[fieldName];
      let fieldDef = this.schemaDef[fieldName];
      let fieldType = fieldDef.type;
      if (fieldValue !== undefined) jsonData[fieldName] = toJsonConverters[fieldType](fieldValue);
    }
    return jsonData;
  }

  toEntityData(jsonData: JsonData): EntityData {
    let entityData: EntityData = {};
    if (jsonData === null) return entityData;
    for (let fieldName in this.schemaDef) {
      let jsonValue = jsonData[fieldName];
      let fieldDef = this.schemaDef[fieldName]
      let fieldType = fieldDef.type;
      if (jsonValue !== undefined && jsonValue !== null)
        entityData[fieldName] = fromJsonConverters[fieldType](jsonValue);
    }
    return entityData;
  }
}

let toHashConverters = {
  'number': (value: EntityValue) => (value as number).toString(),
  'boolean': (value: EntityValue) => (value as boolean) ? '1' : '0',
  'string': (value: EntityValue) => (value as string).toString(),
  'text': (value: EntityValue) => (value as string).toString(),
  'point': (value: EntityValue) => pointToString(value as Point),
  'date': (value: EntityValue) => dateToString(value as Date),
  'string[]': (value: EntityValue, fieldDef: FieldDefinition) => stringArrayToString(value as string[], fieldDef as StringArrayField),
  'object': (value: EntityValue) => (value),
};

let fromHashConverters = {
  'number': stringToNumber,
  'boolean': stringToBoolean,
  'string': (value: string) => value,
  'text': (value: string) => value,
  'point': stringToPoint,
  'date': stringToDate,
  'string[]': (value: string, fieldDef: FieldDefinition) => stringToStringArray(value, fieldDef as StringArrayField),
  'object': (value: any) => value,
};

let toJsonConverters = {
  'number': (value: EntityValue) => value,
  'boolean': (value: EntityValue) => value,
  'string': (value: EntityValue) => value,
  'text': (value: EntityValue) => value,
  'point': (value: EntityValue) => pointToString(value as Point),
  'date': (value: EntityValue) => dateToNumber(value as Date),
  'string[]': (value: EntityValue) => value,
  'object': (value: EntityValue) => value
};

let fromJsonConverters = {
  'number': (value: any) => (value as number),
  'boolean': (value: any) => (value as boolean),
  'string': (value: any) => (value as string),
  'text': (value: any) => (value as string),
  'point': (value: any) => stringToPoint(value as string),
  'date': (value: any) => numberToDate(value as number),
  'string[]': (value: any) => (value as string[]),
  'object': (value: any) => (value)
}

function pointToString(value: Point): string {
  let {longitude, latitude} = value;
  return `${longitude},${latitude}`;
}

function dateToString(value: Date): string {
  return value.getTime().toString();
}

function dateToNumber(value: Date): number {
  return value.getTime();
}

function stringArrayToString(value: string[], fieldDef: StringArrayField): string {
  return value.join(fieldDef.separator ?? '|');
}

function stringToNumber(value: string): number {
  let number = Number.parseFloat(value);
  if (Number.isNaN(number) === false) return number;
  throw Error(`Non-numeric value of '${value}' read from Redis for number field.`);
}

function stringToBoolean(value: string): boolean {
  if (value === '0') return false;
  if (value === '1') return true;
  throw Error(`Non-boolean value of '${value}' read from Redis for boolean field.`);
}

function stringToPoint(value: string): Point {
  let [ longitude, latitude ] = value.split(',').map(Number.parseFloat);
  return { longitude, latitude };
}

function stringToDate(value: string): Date {
  let parsed = Number.parseInt(value);
  if (Number.isNaN(parsed)) throw Error(`Non-numeric value of '${value}' read from Redis for date field.`);
  let date = new Date();
  date.setTime(parsed);
  return date;
}

function stringToStringArray(value: string, fieldDef: StringArrayField) {
  return value.split(fieldDef.separator ?? '|');
}

function numberToDate(value: number): Date {
  let date = new Date();
  date.setTime(value);
  return date;
}
