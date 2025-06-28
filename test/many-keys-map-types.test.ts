import ManyKeysMap from '../index.js';

test('TypeScript: ManyKeysMap basic usage', () => {
	const map = new ManyKeysMap<[string, number], string>();
	map.set(['foo', 1], 'bar');
	expect(map.get(['foo', 1])).toBe('bar');
});

test('ManyKeysMap: different key types', () => {
	const map = new ManyKeysMap<[string, number, boolean], string>();
	map.set(['a', 2, true], 'value1');
	map.set(['a', 2, false], 'value2');
	expect(map.get(['a', 2, true])).toBe('value1');
	expect(map.get(['a', 2, false])).toBe('value2');
	expect(map.has(['a', 2, true])).toBe(true);
	expect(map.has(['a', 2, false])).toBe(true);
	expect(map.has(['a', 3, true])).toBe(false);
});

test('ManyKeysMap: object and symbol keys', () => {
	const object = { x: 1 };
	const sym = Symbol('sym');
	const map = new ManyKeysMap<[Record<string, unknown>, symbol], number>();
	map.set([object, sym], 42);
	expect(map.get([object, sym])).toBe(42);
	expect(map.has([object, sym])).toBe(true);
	expect(map.get([{ x: 1 }, sym])).toBeUndefined();
});

test('ManyKeysMap: null and undefined keys', () => {
	/* eslint-disable-next-line @typescript-eslint/no-restricted-types */
	const map = new ManyKeysMap<[null, undefined], string>();
	map.set([null, undefined], 'null-undefined');
	expect(map.get([null, undefined])).toBe('null-undefined');
	expect(map.has([null, undefined])).toBe(true);
});

test('ManyKeysMap: delete and clear', () => {
	const map = new ManyKeysMap<[string, number], string>();
	map.set(['foo', 1], 'bar');
	map.set(['baz', 2], 'qux');
	expect(map.size).toBe(2);
	expect(map.delete(['foo', 1])).toBe(true);
	expect(map.get(['foo', 1])).toBeUndefined();
	expect(map.size).toBe(1);
	map.clear();
	expect(map.size).toBe(0);
});

test('ManyKeysMap: constructor with iterable', () => {
	const initialValues = [
		[['a', 1], 'x'],
		[['b', 2], 'y'],
	] as Array<[[string, number], string]>;
	const map = new ManyKeysMap<[string, number], string>(initialValues);
	expect(map.get(['a', 1])).toBe('x');
	expect(map.get(['b', 2])).toBe('y');
	expect(map.size).toBe(2);
});

test('ManyKeysMap: throws on non-array keys', () => {
	const map = new ManyKeysMap<[string, number], string>();
	// @ts-expect-error testing bad setter call
	expect(() => map.set('foo', 'bar')).toThrow(TypeError);
	// @ts-expect-error testing bad getter call
	expect(() => map.get('foo')).toThrow(TypeError);
});
