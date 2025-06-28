/* eslint-env jest */
/* eslint-disable unicorn/no-array-for-each -- It's part of the test */
import ManyKeysMap from '../index.js';

describe('ManyKeysMap', () => {
	test('Basics', () => {
		const map = new ManyKeysMap();
		expect(map instanceof Map).toBe(true);
		expect(typeof map[Symbol.iterator]).toBe('function');
		expect(map.size).toBe(0);
		expect(map.get.length).toBe(1);
		expect(map.set.length).toBe(2);
		expect(map.clear.length).toBe(0);
		expect(map.delete.length).toBe(1);
		expect([...map.entries()]).toEqual([]);
		expect([...map.values()]).toEqual([]);
		expect([...map.keys()]).toEqual([]);
		map.forEach(_ => {
			throw new Error('Should not be called');
		});
	});

	test('Set', () => {
		const map = new ManyKeysMap();
		map.set(['-'], 'first');
		expect(map.size).toBe(1);
		expect(map._publicKeys.size).toBe(1);
		map.set(['-'], 'second');
		expect(map.size).toBe(1);
		expect(map._publicKeys.size).toBe(1);
		map.set([':', '-'], 'third');
		expect(map.size).toBe(2);
		expect(map._publicKeys.size).toBe(2);
		map.set([':', '-', '%'], 'fourth');
		expect(map.size).toBe(3);
		expect(map._publicKeys.size).toBe(3);

		// Also make sure that the same map is returned
		expect(map.set(['#', 'fifth'])).toBe(map);

		const prefilledMap = new ManyKeysMap([
			[['-'], 'first'],
			[[':', '-'], 'second'],
		]);
		expect(prefilledMap.size).toBe(2);
	});

	test('Get', () => {
		const map = new ManyKeysMap([
			[['-'], 'first'],
			[[':', '-'], 'second'],
			[[':', '-', '%'], 'third'],
		]);

		expect(map.get(['-'])).toBe('first');
		expect(map.get([':', '-'])).toBe('second');
		expect(map.get([':', '-', '%'])).toBe('third');
		expect(map.get([':'])).toBeUndefined();
		expect(map.get([':', '%'])).toBeUndefined();
		expect(map.get([':', '%', '-'])).toBeUndefined();
	});

	test('Has', () => {
		const map = new ManyKeysMap([
			[['-'], 'first'],
			[[':', '-'], 'second'],
			[[':', '-', '%'], 'third'],
		]);

		expect(map.has(['-'])).toBe(true);
		expect(map.has([':', '-'])).toBe(true);
		expect(map.has([':', '-', '%'])).toBe(true);
		expect(map.has([':'])).toBe(false);
		expect(map.has([':', '%'])).toBe(false);
		expect(map.has([':', '%', '-'])).toBe(false);
	});

	test('Delete', () => {
		const object = {};
		const symbol = Symbol('symbol');

		const map = new ManyKeysMap([
			[['-'], 'first'],
			[[':', '-'], 'second'],
			[[':', '-', '%'], 'third'],
			[[object], 'fourth'],
			[[object, object], 'fifth'],
			[[symbol], 'sixth'],
			[[symbol, object], 'seventh'],
		]);

		expect(map.size).toBe(7);
		expect(map._publicKeys.size).toBe(7);
		expect(map._symbolHashes.size).toBe(1);

		expect(map.delete(['-'])).toBe(true);
		expect(map.size).toBe(6);
		expect(map._publicKeys.size).toBe(6);

		expect(map.delete(['-'])).toBe(false);
		expect(map.size).toBe(6);
		expect(map._publicKeys.size).toBe(6);

		expect(map.delete([':', '-'])).toBe(true);
		expect(map.size).toBe(5);
		expect(map._publicKeys.size).toBe(5);

		expect(map.delete([':', '-', '%'])).toBe(true);
		expect(map.size).toBe(4);
		expect(map._publicKeys.size).toBe(4);

		expect(map.delete([object, object])).toBe(true);
		expect(map.size).toBe(3);
		expect(map._publicKeys.size).toBe(3);

		expect(map.delete([object, object])).toBe(false);
		expect(map.size).toBe(3);
		expect(map._publicKeys.size).toBe(3);

		expect(map.delete([object])).toBe(true);
		expect(map.size).toBe(2);
		expect(map._publicKeys.size).toBe(2);

		expect(map._symbolHashes.size).toBe(1);
		expect(map.delete([symbol])).toBe(true);
		expect(map.size).toBe(1);
		expect(map._publicKeys.size).toBe(1);
		expect(map._symbolHashes.size).toBe(1);

		expect(map._symbolHashes.size).toBe(1);
		expect(map.delete([symbol, object])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);
		expect(map._symbolHashes.size).toBe(1); // Known leak, because of https://github.com/tc39/ecma262/issues/1194
	});

	test('Clear', () => {
		const map = new ManyKeysMap([
			[['-'], 'first'],
			[[':', '-'], 'second'],
			[[':', '-', '%'], 'third'],
			[[{}, [], new Set(), Symbol(1), null], 'fourth'],
		]);

		expect(map.size).toBe(4);
		expect(map._publicKeys.size).toBe(4);
		expect(map._symbolHashes.size).toBe(2); // Symbol(1) and null

		expect(map.clear()).toBeUndefined();
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);
		expect(map._symbolHashes.size).toBe(0);

		expect(map.clear()).toBeUndefined();
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);
		expect(map._symbolHashes.size).toBe(0);
	});

	test('Iterators', () => {
		const pairs = [
			[['-'], 'first'],
			[[':', '-'], 'second'],
			[[':', '-', '%'], 'third'],
		];
		const map = new ManyKeysMap(pairs);
		const regularMap = new Map(pairs);

		expect([...map]).toEqual(pairs);
		expect([...map.entries()]).toEqual(pairs);

		// The returned values and keys match regular Maps,
		// but in ManyKeysMap, key Arrays are stored by value rather than by reference.
		expect([...map.values()]).toEqual([...regularMap.values()]);
		expect([...map.keys()]).toEqual([...regularMap.keys()]);

		let count = 0;
		map.forEach(() => {
			count++;
		});
		expect(count).toBe(pairs.length);
	});

	test('All types of keys', () => {
		const map = new ManyKeysMap();

		expect(map.set([], '').get([])).toBe('');
		expect(map.size).toBe(1);
		expect(map.delete([])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);

		expect(map.set([''], '').get([''])).toBe('');
		expect(map.size).toBe(1);
		expect(map.delete([''])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);

		expect(map.set([1], 'number').get([1])).toBe('number');
		expect(map.size).toBe(1);
		expect(map.delete([1])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);

		expect(map.set([true], 'boolean').get([true])).toBe('boolean');
		expect(map.size).toBe(1);
		expect(map.delete([true])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);

		expect(map.set([undefined], 'undefined').get([undefined])).toBe('undefined');
		expect(map.size).toBe(1);
		expect(map.delete([undefined])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);

		expect(map.set([Number.NaN], 'NaN').get([Number.NaN])).toBe('NaN');
		expect(map.size).toBe(1);
		expect(map.delete([Number.NaN])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);

		let key = {};
		let key2 = {}; // A second seemigly-identical key ensures that objects are stored by reference
		expect(map.set([key], 'object').get([key])).toBe('object');
		expect(map.set([key2], 'object2').get([key2])).toBe('object2');
		expect(map.size).toBe(2);
		expect(map.delete([key])).toBe(true);
		expect(map.size).toBe(1);
		expect(map.delete([key2])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);

		key = [];
		key2 = [];
		expect(map.set([key], 'array').get([key])).toBe('array');
		expect(map.set([key2], 'array2').get([key2])).toBe('array2');
		expect(map.size).toBe(2);
		expect(map.delete([key])).toBe(true);
		expect(map.size).toBe(1);
		expect(map.delete([key2])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);

		key = () => {};
		key2 = () => {};
		expect(map.set([key], 'function').get([key])).toBe('function');
		expect(map.set([key2], 'function2').get([key2])).toBe('function2');
		expect(map.size).toBe(2);
		expect(map.delete([key])).toBe(true);
		expect(map.size).toBe(1);
		expect(map.delete([key2])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);

		key = Symbol('symbol');
		key2 = Symbol('symbol');
		expect(map.set([key], 'symbol').get([key])).toBe('symbol');
		expect(map.set([key2], 'symbol2').get([key2])).toBe('symbol2');
		expect(map.size).toBe(2);
		expect(map._symbolHashes.size).toBe(2);
		expect(map.delete([key])).toBe(true);
		expect(map.size).toBe(1);
		expect(map.delete([key2])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);
		expect(map._symbolHashes.size).toBe(2); // Known leak, because of https://github.com/tc39/ecma262/issues/1194

		expect(map.set([null], 'null').get([null])).toBe('null');
		expect(map.size).toBe(1);
		expect(map.delete([null])).toBe(true);
		expect(map.size).toBe(0);
		expect(map._publicKeys.size).toBe(0);
	});

	test('Mixed types of keys', () => {
		const map = new ManyKeysMap();
		map.set([1, '1', true], 'truthy');
		expect(map.size).toBe(1);
		expect(map.get([1, '1', true])).toBe('truthy');
		expect(map.get([1, '1', 'true'])).toBeUndefined();
		expect(map.get(['1', '1', true])).toBeUndefined();
		expect(map.get([1, '1', true, 1])).toBeUndefined();
		expect(map.get([1, 1, 1])).toBeUndefined();

		map.set([false, null, undefined], 'falsy');
		expect(map.size).toBe(2);
		expect(map.get([false, null, undefined])).toBe('falsy');
		expect(map.get([false, 'null', 'undefined'])).toBeUndefined();
		expect(map.get(['null', 'null', undefined])).toBeUndefined();
		expect(map.get([false, 'null', undefined, false])).toBeUndefined();
		expect(map.get([false, false, false])).toBeUndefined();
		expect(map.get([undefined, undefined, undefined])).toBeUndefined();

		map.set([undefined], 'undefined');
		expect(map.size).toBe(3);
		expect(map.get([undefined])).toBe('undefined');
		expect(map.get(['undefined'])).toBeUndefined();
		expect(map.get([,])).toBe('undefined'); // eslint-disable-line no-sparse-arrays

		const key1 = {};
		const key2 = {};
		const key3 = Symbol(3);
		const key4 = Symbol(4);
		map.set([key1, key2, key3, key4], 'references');
		expect(map.size).toBe(4);
		expect(map.get([key1, key2, key3, key4])).toBe('references');
		expect(map.get([key2, key1, key3, key4])).toBeUndefined();
		expect(map.get([key1, key2, key4, key3])).toBeUndefined();
		expect(map.get([key1, key2, key3, Symbol(4)])).toBeUndefined();
	});

	test('Internal state consistency', () => {
		const map = new ManyKeysMap();

		const keys = [1, 2];
		map.set(keys, 'happy');
		expect(map.get([1, 2])).toBe('happy');
		keys.push(3); // Change original object

		const privateKey = JSON.stringify([1, 2]);
		expect(map._publicKeys.get(privateKey)).toEqual([1, 2]);
	});
});
