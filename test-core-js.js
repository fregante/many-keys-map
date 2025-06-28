/* eslint-env jest */
/* eslint-disable unicorn/no-array-for-each, unicorn/prefer-number-properties,  -- it's part of the test */
/*

Copyright(c) 2014 - 2019 Denis Pushkarev

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files(the "Software"), to deal in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

// Source
// https://github.com/zloirock/core-js/blob/4d3549dc0490e2d581006de87350006852754d10/tests/tests/es.map.js

import ManyKeysMap from './index.js';

const isIterator = it =>
	typeof it === 'object' && typeof it.next === 'function';

function createIterable(elements, methods) {
	const iterable = {
		called: false,
		received: false,
		[Symbol.iterator]() {
			iterable.received = true;
			let index = 0;
			const iterator = {
				next() {
					iterable.called = true;
					return {
						value: elements[index++],
						done: index > elements.length,
					};
				},
			};
			if (methods) {
				for (const key of Object.keys(methods)) {
					iterator[key] = methods[key];
				}
			}

			return iterator;
		},
	};
	return iterable;
}

describe('ManyKeysMap (Javascript -- Core Implementation)', () => {
	it('basic properties and methods', () => {
		expect(typeof ManyKeysMap).toBe('function');
		expect(ManyKeysMap.length).toBe(0);
		expect(ManyKeysMap.name).toBe('ManyKeysMap');
		expect('clear' in ManyKeysMap.prototype).toBe(true);
		expect('delete' in ManyKeysMap.prototype).toBe(true);
		expect('forEach' in ManyKeysMap.prototype).toBe(true);
		expect('get' in ManyKeysMap.prototype).toBe(true);
		expect('has' in ManyKeysMap.prototype).toBe(true);
		expect('set' in ManyKeysMap.prototype).toBe(true);
		expect(new ManyKeysMap() instanceof ManyKeysMap).toBe(true);
		expect(new ManyKeysMap(createIterable([
			[[1], 1],
			[[2], 2],
			[[3], 3],
		])).size).toBe(3);
		expect(new ManyKeysMap([
			[Object.freeze([{}]), 1],
			[[2], 3],
		]).size).toBe(2);
		let done = false;
		try {
			new ManyKeysMap(createIterable([null, 1, 2], {
				return() {
					done = true;
					return true;
				},
			}));
		} catch {
			/* Empty */
		}

		expect(done).toBe(true);
		const array = [];
		done = false;
		array['@@iterator'] = undefined;
		array[Symbol.iterator] = function () {
			done = true;
			return Array.prototype[Symbol.iterator].call(this);
		};

		new ManyKeysMap(array);
		expect(done).toBe(true);
		const object = {};
		new ManyKeysMap().set([object], 1);
		const results = [];
		for (const key of Object.keys(object)) {
			results.push(key);
		}

		expect(results).toEqual([]);
		expect(Object.keys(object)).toEqual([]);
		expect(Object.getOwnPropertyNames(object)).toEqual([]);
		if (Object.getOwnPropertySymbols) {
			expect(Object.getOwnPropertySymbols(object)).toEqual([]);
		}

		expect(Reflect.ownKeys(object)).toEqual([]);
		class Subclass extends ManyKeysMap {}
		expect(new Subclass() instanceof Subclass).toBe(true);
		expect(new Subclass() instanceof ManyKeysMap).toBe(true);
		expect(new Subclass().set([1], 2).get([1])).toBe(2);
	});
});

describe('ManyKeysMap#clear', () => {
	it('basic properties', () => {
		expect(typeof ManyKeysMap.prototype.clear).toBe('function');
		expect(ManyKeysMap.prototype.clear.length).toBe(0);
		expect(ManyKeysMap.prototype.clear.name).toBe('clear');
		expect(Object.prototype.propertyIsEnumerable.call(
			ManyKeysMap.prototype,
			'clear',
		)).toBe(false);
	});
	it('functionality', () => {
		let map = new ManyKeysMap();
		map.clear();
		expect(map.size).toBe(0);
		map = new ManyKeysMap();
		map.set([1], 2);
		map.set([2], 3);
		map.set([1], 4);
		map.clear();
		expect(map.size).toBe(0);
		expect(!map.has([1])).toBe(true);
		expect(!map.has([2])).toBe(true);
		const frozen = [Object.freeze({})];
		map = new ManyKeysMap();
		map.set([1], 2);
		map.set(frozen, 3);
		map.clear();
		expect(map.size).toBe(0);
		expect(!map.has([1])).toBe(true);
		expect(!map.has(frozen)).toBe(true);
	});
});

describe('ManyKeysMap#delete', () => {
	it('basic properties', () => {
		expect(typeof ManyKeysMap.prototype.delete).toBe('function');
		expect(ManyKeysMap.prototype.delete.length).toBe(1);
		expect(ManyKeysMap.prototype.delete.name).toBe('delete');
		expect(Object.prototype.propertyIsEnumerable.call(
			ManyKeysMap.prototype,
			'delete',
		)).toBe(false);
	});
	it('functionality', () => {
		const object = {};
		const map = new ManyKeysMap();
		map.set([NaN], 1);
		map.set([2], 1);
		map.set([3], 7);
		map.set([2], 5);
		map.set([1], 4);
		map.set([object], 9);
		expect(map.size).toBe(5);
		expect(map.delete([NaN])).toBe(true);
		expect(map.size).toBe(4);
		expect(map.delete([4])).toBe(false);
		expect(map.size).toBe(4);
		map.delete([[]]);
		expect(map.size).toBe(4);
		map.delete([object]);
		expect(map.size).toBe(3);
		const frozen = Object.freeze({});
		map.set([frozen], 42);
		expect(map.size).toBe(4);
		map.delete([frozen]);
		expect(map.size).toBe(3);
	});
});

describe('ManyKeysMap#forEach', () => {
	it('basic properties', () => {
		expect(typeof ManyKeysMap.prototype.forEach).toBe('function');
		expect(ManyKeysMap.prototype.forEach.length).toBe(1);
		expect(ManyKeysMap.prototype.forEach.name).toBe('forEach');
		expect(Object.prototype.propertyIsEnumerable.call(
			ManyKeysMap.prototype,
			'forEach',
		)).toBe(false);
	});
	it('functionality', () => {
		let result = {};
		let count = 0;
		const object = {};
		let map = new ManyKeysMap();
		map.set([NaN], 1);
		map.set([2], 1);
		map.set([3], 7);
		map.set([2], 5);
		map.set([1], 4);
		map.set([object], 9);
		map.forEach((value, key) => {
			count++;
			result[value] = key;
		});
		expect(count).toBe(5);
		expect(result).toEqual({
			1: [NaN],
			7: [3],
			5: [2],
			4: [1],
			9: [object],
		});
		map = new ManyKeysMap();
		map.set(['0'], 9);
		map.set(['1'], 9);
		map.set(['2'], 9);
		map.set(['3'], 9);
		result = '';
		map.forEach((value, key) => {
			result += key[0];
			if (key[0] === '2') {
				map.delete(['2']);
				map.delete(['3']);
				map.delete(['1']);
				map.set(['4'], 9);
			}
		});
		expect(result).toBe('0124');
		map = new ManyKeysMap([[['0'], 1]]);
		result = '';
		map.forEach(value => {
			map.delete(['0']);
			if (result !== '') {
				throw new Error('This shouldn’t happen');
			}

			result += value;
		});
		expect(result).toBe('1');
		expect(() => {
			ManyKeysMap.prototype.forEach.call(new Set(), () => {
				/* Empty */
			});
		}).toThrow('Method Map.prototype.forEach called on incompatible receiver #<Set>');
	});
});

describe('ManyKeysMap#get', () => {
	it('basic properties', () => {
		expect(typeof ManyKeysMap.prototype.get).toBe('function');
		expect(ManyKeysMap.prototype.get.name).toBe('get');
		expect(ManyKeysMap.prototype.get.length).toBe(1);
		expect(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'get')).toBe(false);
	});
	it('functionality', () => {
		const object = {};
		const frozen = Object.freeze({});
		const map = new ManyKeysMap();
		map.set([NaN], 1);
		map.set([2], 1);
		map.set([3], 1);
		map.set([2], 5);
		map.set([1], 4);
		map.set([frozen], 42);
		map.set([object], object);
		expect(map.get([NaN])).toBe(1);
		expect(map.get([4])).toBe(undefined);
		expect(map.get([{}])).toBe(undefined);
		expect(map.get([object])).toBe(object);
		expect(map.get([frozen])).toBe(42);
		expect(map.get([2])).toBe(5);
	});
});

describe('ManyKeysMap#has', () => {
	it('basic properties', () => {
		expect(typeof ManyKeysMap.prototype.has).toBe('function');
		expect(ManyKeysMap.prototype.has.name).toBe('has');
		expect(ManyKeysMap.prototype.has.length).toBe(1);
		expect(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'has')).toBe(false);
	});
	it('functionality', () => {
		const object = {};
		const frozen = Object.freeze({});
		const map = new ManyKeysMap();
		map.set([NaN], 1);
		map.set([2], 1);
		map.set([3], 1);
		map.set([2], 5);
		map.set([1], 4);
		map.set([frozen], 42);
		map.set([object], object);
		expect(map.has([NaN])).toBe(true);
		expect(map.has([object])).toBe(true);
		expect(map.has([2])).toBe(true);
		expect(map.has([frozen])).toBe(true);
		expect(map.has([4])).toBe(false);
		expect(map.has([{}])).toBe(false);
	});
});

describe('ManyKeysMap#set', () => {
	it('basic properties', () => {
		expect(typeof ManyKeysMap.prototype.set).toBe('function');
		expect(ManyKeysMap.prototype.set.name).toBe('set');
		expect(ManyKeysMap.prototype.set.length).toBe(2);
		expect(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'set')).toBe(false);
	});
	it('functionality', () => {
		const object = {};
		let map = new ManyKeysMap();
		map.set([NaN], 1);
		map.set([2], 1);
		map.set([3], 1);
		map.set([2], 5);
		map.set([1], 4);
		map.set([object], object);
		expect(map.size === 5).toBe(true);
		const chain = map.set([7], 2);
		expect(chain).toBe(map);
		map.set([7], 2);
		expect(map.size).toBe(6);
		expect(map.get([7])).toBe(2);
		expect(map.get([NaN])).toBe(1);
		map.set([NaN], 42);
		expect(map.size).toBe(6);
		expect(map.get([NaN])).toBe(42);
		map.set([{}], 11);
		expect(map.size).toBe(7);
		expect(map.get([object])).toBe(object);
		map.set([object], 27);
		expect(map.size).toBe(7);
		expect(map.get([object])).toBe(27);
		map = new ManyKeysMap();
		map.set([NaN], 2);
		map.set([NaN], 3);
		map.set([NaN], 4);
		expect(map.size).toBe(1);
		const frozen = Object.freeze({});
		map = new ManyKeysMap().set([frozen], 42);
		expect(map.get([frozen])).toBe(42);
	});
});

describe('ManyKeysMap#size', () => {
	it('basic properties', () => {
		expect(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'size')).toBe(false);
	});
	it('functionality', () => {
		const map = new ManyKeysMap();
		map.set([2], 1);
		const { size } = map;
		expect(typeof size).toBe('number');
		expect(size).toBe(1);
		const sizeDescriptor = Object.getOwnPropertyDescriptor(
			ManyKeysMap.prototype,
			'size',
		);
		expect(sizeDescriptor?.get).toBeTruthy();
		expect(sizeDescriptor && !sizeDescriptor.set).toBeTruthy();
		expect(() => ManyKeysMap.prototype.size).toThrow(TypeError);
	});
});

describe('ManyKeysMap#@@toStringTag', () => {
	it('basic properties', () => {
		expect(ManyKeysMap.prototype[Symbol.toStringTag]).toBe('ManyKeysMap');
	});
	it('functionality', () => {
		expect(String(new ManyKeysMap())).toBe('[object ManyKeysMap]');
	});
});

describe('ManyKeysMap Iterator', () => {
	it('basic properties', () => {
		const map = new ManyKeysMap();
		map.set(['a'], 1);
		map.set(['b'], 2);
		map.set(['c'], 3);
		map.set(['d'], 4);
		const iterator = map.keys();
		expect(isIterator(iterator)).toBe(true);
		expect(Object.prototype.propertyIsEnumerable.call(iterator, 'next')).toBe(false);
		expect(Object.prototype.propertyIsEnumerable.call(iterator, Symbol.iterator)).toBe(false);
	});
	it('functionality', () => {
		const map = new ManyKeysMap();
		map.set(['a'], 1);
		map.set(['b'], 2);
		map.set(['c'], 3);
		map.set(['d'], 4);
		const results = [];
		const iterator = map.keys();
		results.push(iterator.next().value);
		expect(map.delete(['a'])).toBe(true);
		expect(map.delete(['b'])).toBe(true);
		expect(map.delete(['c'])).toBe(true);
		map.set(['e']);
		results.push(iterator.next().value, iterator.next().value);
		expect(iterator.next().done).toBe(true);
		map.set(['f']);
		expect(iterator.next().done).toBe(true);
		expect(results).toEqual([['a'], ['d'], ['e']]);
	});
});

describe('ManyKeysMap#keys', () => {
	it('basic properties', () => {
		expect(typeof ManyKeysMap.prototype.keys).toBe('function');
		expect(ManyKeysMap.prototype.keys.name).toBe('keys');
		expect(ManyKeysMap.prototype.keys.length).toBe(0);
		expect(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'keys')).toBe(false);
	});
	it('functionality', () => {
		const map = new ManyKeysMap();
		map.set(['a'], 'q');
		map.set(['s'], 'w');
		map.set(['d'], 'e');
		const iterator = map.keys();
		expect(isIterator(iterator)).toBe(true);
		expect(iterator[Symbol.toStringTag]).toBe('Map Iterator');
		expect(iterator.next()).toEqual({
			value: ['a'],
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: ['s'],
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: ['d'],
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: undefined,
			done: true,
		});
	});
});

describe('ManyKeysMap#values', () => {
	it('basic properties', () => {
		expect(typeof ManyKeysMap.prototype.values).toBe('function');
		expect(ManyKeysMap.prototype.values.name).toBe('values');
		expect(ManyKeysMap.prototype.values.length).toBe(0);
		expect(Object.prototype.propertyIsEnumerable.call(
			ManyKeysMap.prototype,
			'values',
		)).toBe(false);
	});
	it('functionality', () => {
		const map = new ManyKeysMap();
		map.set(['a'], 'q');
		map.set(['s'], 'w');
		map.set(['d'], 'e');
		const iterator = map.values();
		expect(isIterator(iterator)).toBe(true);
		expect(iterator[Symbol.toStringTag]).toBe('Map Iterator');
		expect(iterator.next()).toEqual({
			value: 'q',
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: 'w',
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: 'e',
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: undefined,
			done: true,
		});
	});
});

describe('ManyKeysMap#entries', () => {
	it('basic properties', () => {
		expect(typeof ManyKeysMap.prototype.entries).toBe('function');
		expect(ManyKeysMap.prototype.entries.name).toBe('entries');
		expect(ManyKeysMap.prototype.entries.length).toBe(0);
		expect(Object.prototype.propertyIsEnumerable.call(
			ManyKeysMap.prototype,
			'entries',
		)).toBe(false);
	});
	it('functionality', () => {
		const map = new ManyKeysMap();
		map.set(['a'], 'q');
		map.set(['s'], 'w');
		map.set(['d'], 'e');
		const iterator = map.entries();
		expect(isIterator(iterator)).toBe(true);
		expect(iterator[Symbol.toStringTag]).toBe('Map Iterator');
		expect(iterator.next()).toEqual({
			value: [['a'], 'q'],
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: [['s'], 'w'],
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: [['d'], 'e'],
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: undefined,
			done: true,
		});
	});
});

describe('ManyKeysMap#@@iterator', () => {
	it('basic properties', () => {
		expect(ManyKeysMap.prototype.entries.name).toBe('entries');
		expect(ManyKeysMap.prototype.entries.length).toBe(0);
		expect(ManyKeysMap.prototype[Symbol.iterator]).toBe(ManyKeysMap.prototype.entries);
	});
	it('functionality', () => {
		const map = new ManyKeysMap();
		map.set(['a'], 'q');
		map.set(['s'], 'w');
		map.set(['d'], 'e');
		const iterator = map[Symbol.iterator]();
		expect(isIterator(iterator)).toBe(true);
		expect(iterator[Symbol.toStringTag]).toBe('Map Iterator');
		expect(String(iterator)).toBe('[object Map Iterator]');
		expect(iterator.next()).toEqual({
			value: [['a'], 'q'],
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: [['s'], 'w'],
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: [['d'], 'e'],
			done: false,
		});
		expect(iterator.next()).toEqual({
			value: undefined,
			done: true,
		});
	});
});
