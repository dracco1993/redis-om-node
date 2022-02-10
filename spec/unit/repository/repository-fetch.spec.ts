import { mocked } from 'ts-jest/utils';

import Client from '../../../lib/client';
import Repository from '../../../lib/repository/repository';

import { 
  AN_ARRAY, AN_ARRAY_JOINED,
  A_DATE, A_DATE_EPOCH,
  A_GEOPOINT, A_GEOPOINT_STRING } from '../helpers/test-data';

import { simpleHashSchema, simpleJsonSchema, SimpleHashEntity, SimpleJsonEntity } from '../helpers/test-entity-and-schema';

jest.mock('../../../lib/client');


beforeEach(() => mocked(Client).mockReset());

describe("Repository", () => {

  let client: Client;
  let entityId = 'foo';

  describe("#fetch", () => {

    beforeAll(() => client = new Client());

    describe.each([

      [ "when fetching a fully populated entity from a hash", {
        mockedData: { aString: 'foo', aNumber: '42', aBoolean: '0', aGeoPoint: A_GEOPOINT_STRING, aDate: A_DATE_EPOCH.toString(), anArray: AN_ARRAY_JOINED },
        expectedData: { aString: 'foo', aNumber: 42, aBoolean: false, aGeoPoint: A_GEOPOINT, aDate: A_DATE, anArray: AN_ARRAY }
      }],

      [ "when fetching a partially populated entity from a hash", {
        mockedData: { aString: 'foo', aNumber: '42' },
        expectedData: { aString: 'foo', aNumber: 42, aBoolean: null, aDate: null, aGeoPoint: null, anArray: null }
      }],

      [ "when fetching a empty entity from a hash", {
        mockedData: {},
        expectedData: { aString: null, aNumber: null, aBoolean: null, aDate: null, aGeoPoint: null, anArray: null }
      }]

    ])("%s", (_, data) => {

      let repository: Repository<SimpleHashEntity>;
      let entity: SimpleHashEntity;
    
      beforeEach(async () => {
        repository = new Repository(simpleHashSchema, client);
        mocked(Client.prototype.hgetall).mockResolvedValue(data.mockedData)
        entity = await repository.fetch(entityId);
      });

      it("returns the expected entity", () =>
        expect(entity).toEqual(expect.objectContaining({ entityId, ...data.expectedData })));
    });

    describe.each([

      ["when fetching a fully populated entity from JSON", {
        mockedData: { aString: 'foo', aNumber: 42, aBoolean: false, aGeoPoint: A_GEOPOINT_STRING, aDate: A_DATE_EPOCH, anArray: AN_ARRAY },
        expectedData: { aString: 'foo', aNumber: 42, aBoolean: false, aGeoPoint: A_GEOPOINT, aDate: A_DATE, anArray: AN_ARRAY }
      }],

      [ "when fetching a partially populated entity from JSON", {
        mockedData: { aString: 'foo', aNumber: 42 },
        expectedData: { aString: 'foo', aNumber: 42, aBoolean: null, aGeoPoint: null, aDate: null, anArray: null }
      }],

      [ "when fetching an empty entity from JSON", {
        mockedData: {},
        expectedData: { aString: null, aNumber: null, aBoolean: null, aGeoPoint: null, aDate: null, anArray: null }
      }],
      
      [ "when fetching a missing entity from JSON", {
        mockedData: null,
        expectedData: { aString: null, aNumber: null, aBoolean: null, aGeoPoint: null, aDate: null, anArray: null }
      }],
      
      [ "when fetching an entity from JSON with nulls", {
        mockedData: { aString: 'foo', aNumber: 42, aBoolean: null, aGeoPoint: null, aDate: null, anArray: null },
        expectedData: { aString: 'foo', aNumber: 42, aBoolean: null, aGeoPoint: null, aDate: null, anArray: null }
      }]

    ])("%s", (_, data: any) => {

      let repository: Repository<SimpleJsonEntity>;
      let entity: SimpleJsonEntity;

      beforeEach(async () => {
        repository = new Repository(simpleJsonSchema, client);
        mocked(Client.prototype.jsonget).mockResolvedValue(data.mockedData)
        entity = await repository.fetch(entityId);
      });

      it("returns the expected entity", () =>
        expect(entity).toEqual(expect.objectContaining({ entityId, ...data.expectedData })));
    });
  });
});
