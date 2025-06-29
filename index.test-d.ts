import {expectTypeOf, it} from 'vitest';
import ManyKeysMap from './index.js';

it('should be a class that extends Map', () => {
	// Use toBeConstructibleWith() for checking if a class is constructible
	expectTypeOf(ManyKeysMap).toBeConstructibleWith();
	// eslint-disable-next-line @typescript-eslint/no-deprecated
	expectTypeOf(ManyKeysMap.prototype).toMatchTypeOf(Map.prototype);
});

it('should correctly infer key and value types', () => {
  type KeyTuple = [string, number];
  type ValueType = {id: string; name: string};

  const map = new ManyKeysMap<KeyTuple, ValueType>();

  // Use toEqualTypeOf() for checking the type of an instance
  expectTypeOf(map).toEqualTypeOf<ManyKeysMap<KeyTuple, ValueType>>();
  expectTypeOf(map).not.toEqualTypeOf<ManyKeysMap<[number], string>>();

  // Test set method
  expectTypeOf(map.set).parameter(0).toEqualTypeOf<KeyTuple>();
  expectTypeOf(map.set).parameter(1).toEqualTypeOf<ValueType>();
  expectTypeOf(map.set(['a', 1], {id: 'x', name: 'y'})).toEqualTypeOf<typeof map>();

  // Test get method
  expectTypeOf(map.get).parameter(0).toEqualTypeOf<KeyTuple>();
  expectTypeOf(map.get(['a', 1])).toEqualTypeOf<ValueType | undefined>();

  // Test has method
  expectTypeOf(map.has).parameter(0).toEqualTypeOf<KeyTuple>();
  expectTypeOf(map.has(['a', 1])).toEqualTypeOf<boolean>();

  // Test delete method
  expectTypeOf(map.delete).parameter(0).toEqualTypeOf<KeyTuple>();
  expectTypeOf(map.delete(['a', 1])).toEqualTypeOf<boolean>();
});

it('should handle different key and value types', () => {
  type DiverseKey = [boolean, number, string];
  type DiverseValue = {status: 'active' | 'inactive'};

  const map = new ManyKeysMap<DiverseKey, DiverseValue>();

  expectTypeOf(map.set([true, 123, 'hello'], {status: 'active'})).toEqualTypeOf<typeof map>();
  expectTypeOf(map.get([false, 456, 'world'])).toEqualTypeOf<DiverseValue | undefined>();
});
