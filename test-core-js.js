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

import test from 'ava';

const isIterator = it => typeof it === 'object' && typeof it.next === 'function';

const DESCRIPTORS = Boolean((() => {
	try {
		return (
			Object.defineProperty({}, 'a', {
				get() {
					return 7;
				}
			}).a === 7
		);
	} catch (error) {
		/* Empty */
	}
})());

const GLOBAL = new Function('return this')();
const NATIVE = GLOBAL.NATIVE || false;
const {
	getOwnPropertyDescriptor,
	keys,
	getOwnPropertyNames,
	getOwnPropertySymbols,
	freeze
} = Object;
const {ownKeys} = GLOBAL.Reflect || {};

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
						done: index > elements.length
					};
				}
			};
			if (methods) {
				for (const key in methods) {
					iterator[key] = methods[key];
				}
			}

			return iterator;
		}
	};
	return iterable;
}

const nativeSubclass = (() => {
	try {
		if (
			new Function(`
      'use strict';
      class Subclass extends Object { /* empty */ };
      return new Subclass() instanceof Subclass;
    `)()
		) {
			return new Function(
				'Parent',
				`
      'use strict';
      return class extends Parent { /* empty */ };
    `
			);
		}
	} catch (error) {
		/* Empty */
	}
})();

test('Map', t => {
	t.is(typeof Map, 'function');
	t.is(Map.length, 0);
	t.is(Map.name, 'Map');
	t.true('clear' in Map.prototype, 'clear in Map.prototype');
	t.true('delete' in Map.prototype, 'delete in Map.prototype');
	t.true('forEach' in Map.prototype, 'forEach in Map.prototype');
	t.true('get' in Map.prototype, 'get in Map.prototype');
	t.true('has' in Map.prototype, 'has in Map.prototype');
	t.true('set' in Map.prototype, 'set in Map.prototype');
	t.true(new Map() instanceof Map, 'new Map instanceof Map');
	t.is(
		new Map(createIterable([[1, 1], [2, 2], [3, 3]])).size,
		3,
		'Init from iterable'
	);
	t.is(
		new Map([[freeze({}), 1], [2, 3]]).size,
		2,
		'Support frozen objects'
	);
	let done = false;
	try {
		new Map(
			createIterable([null, 1, 2], {
				return() {
					done = true;
					return true;
				}
			})
		);
	} catch (error) {
		/* Empty */
	}

	t.true(done, '.return #throw');
	const array = [];
	done = false;
	array['@@iterator'] = undefined;
	array[Symbol.iterator] = function () {
		done = true;
		return [][Symbol.iterator].call(this);
	};

	new Map(array);
	t.true(done);
	const object = {};
	new Map().set(object, 1);
	if (DESCRIPTORS) {
		const results = [];
		for (const key in object) {
			results.push(key);
		}

		t.deepEqual(results, []);
		t.deepEqual(keys(object), []);
	}

	t.deepEqual(getOwnPropertyNames(object), []);
	if (getOwnPropertySymbols) {
		t.deepEqual(getOwnPropertySymbols(object), []);
	}

	if (ownKeys) {
		t.deepEqual(ownKeys(object), []);
	}

	if (nativeSubclass) {
		const Subclass = nativeSubclass(Map);
		t.true(
			new Subclass() instanceof Subclass,
			'correct subclassing with native classes #1'
		);
		t.true(
			new Subclass() instanceof Map,
			'correct subclassing with native classes #2'
		);
		t.is(
			new Subclass().set(1, 2).get(1),
			2,
			'correct subclassing with native classes #3'
		);
	}
});

test('Map#clear', t => {
	t.is(typeof Map.prototype.clear, 'function');
	t.is(Map.prototype.clear.length, 0);
	t.is(Map.prototype.clear.name, 'clear');
	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'clear'));
	let map = new Map();
	map.clear();
	t.is(map.size, 0);
	map = new Map();
	map.set(1, 2);
	map.set(2, 3);
	map.set(1, 4);
	map.clear();
	t.is(map.size, 0);
	t.true(!map.has(1));
	t.true(!map.has(2));
	const frozen = freeze({});
	map = new Map();
	map.set(1, 2);
	map.set(frozen, 3);
	map.clear();
	t.is(map.size, 0, 'Support frozen objects');
	t.true(!map.has(1));
	t.true(!map.has(frozen));
});

test('Map#delete', t => {
	t.is(typeof Map.prototype.delete, 'function');
	t.is(Map.prototype.delete.length, 1);
	if (NATIVE) {
		t.is(Map.prototype.delete.name, 'delete');
	}

	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'delete'));
	const object = {};
	const map = new Map();
	map.set(NaN, 1);
	map.set(2, 1);
	map.set(3, 7);
	map.set(2, 5);
	map.set(1, 4);
	map.set(object, 9);
	t.is(map.size, 5);
	t.true(map.delete(NaN));
	t.is(map.size, 4);
	t.false(map.delete(4));
	t.is(map.size, 4);
	map.delete([]);
	t.is(map.size, 4);
	map.delete(object);
	t.is(map.size, 3);
	const frozen = freeze({});
	map.set(frozen, 42);
	t.is(map.size, 4);
	map.delete(frozen);
	t.is(map.size, 3);
});

test('Map#forEach', t => {
	t.is(typeof Map.prototype.forEach, 'function');
	t.is(Map.prototype.forEach.length, 1);
	t.is(Map.prototype.forEach.name, 'forEach');
	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'forEach'));
	let result = {};
	let count = 0;
	const object = {};
	let map = new Map();
	map.set(NaN, 1);
	map.set(2, 1);
	map.set(3, 7);
	map.set(2, 5);
	map.set(1, 4);
	map.set(object, 9);
	map.forEach((value, key) => {
		count++;
		result[value] = key;
	});
	t.is(count, 5);
	t.deepEqual(result, {
		1: NaN,
		7: 3,
		5: 2,
		4: 1,
		9: object
	});
	map = new Map();
	map.set('0', 9);
	map.set('1', 9);
	map.set('2', 9);
	map.set('3', 9);
	result = '';
	map.forEach((value, key) => {
		result += key;
		if (key === '2') {
			map.delete('2');
			map.delete('3');
			map.delete('1');
			map.set('4', 9);
		}
	});
	t.is(result, '0124');
	map = new Map([['0', 1]]);
	result = '';
	map.forEach(value => {
		map.delete('0');
		if (result !== '') {
			throw new Error();
		}

		result += value;
	});
	t.is(result, '1');
	t.throws(() => {
		Map.prototype.forEach.call(new Set(), () => {
			/* Empty */
		});
	}, 'Method Map.prototype.forEach called on incompatible receiver #<Set>');
});

test('Map#get', t => {
	t.is(typeof Map.prototype.get, 'function');
	t.is(Map.prototype.get.name, 'get');
	t.is(Map.prototype.get.length, 1);
	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'get'));
	const object = {};
	const frozen = freeze({});
	const map = new Map();
	map.set(NaN, 1);
	map.set(2, 1);
	map.set(3, 1);
	map.set(2, 5);
	map.set(1, 4);
	map.set(frozen, 42);
	map.set(object, object);
	t.is(map.get(NaN), 1);
	t.is(map.get(4), undefined);
	t.is(map.get({}), undefined);
	t.is(map.get(object), object);
	t.is(map.get(frozen), 42);
	t.is(map.get(2), 5);
});

test('Map#has', t => {
	t.is(typeof Map.prototype.has, 'function');
	t.is(Map.prototype.has.name, 'has');
	t.is(Map.prototype.has.length, 1);
	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'has'));
	const object = {};
	const frozen = freeze({});
	const map = new Map();
	map.set(NaN, 1);
	map.set(2, 1);
	map.set(3, 1);
	map.set(2, 5);
	map.set(1, 4);
	map.set(frozen, 42);
	map.set(object, object);
	t.true(map.has(NaN));
	t.true(map.has(object));
	t.true(map.has(2));
	t.true(map.has(frozen));
	t.true(!map.has(4));
	t.true(!map.has({}));
});

test('Map#set', t => {
	t.is(typeof Map.prototype.set, 'function');
	t.is(Map.prototype.set.name, 'set');
	t.is(Map.prototype.set.length, 2);
	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'set'));
	const object = {};
	let map = new Map();
	map.set(NaN, 1);
	map.set(2, 1);
	map.set(3, 1);
	map.set(2, 5);
	map.set(1, 4);
	map.set(object, object);
	t.true(map.size === 5);
	const chain = map.set(7, 2);
	t.is(chain, map);
	map.set(7, 2);
	t.is(map.size, 6);
	t.is(map.get(7), 2);
	t.is(map.get(NaN), 1);
	map.set(NaN, 42);
	t.is(map.size, 6);
	t.is(map.get(NaN), 42);
	map.set({}, 11);
	t.is(map.size, 7);
	t.is(map.get(object), object);
	map.set(object, 27);
	t.is(map.size, 7);
	t.is(map.get(object), 27);
	map = new Map();
	map.set(NaN, 2);
	map.set(NaN, 3);
	map.set(NaN, 4);
	t.is(map.size, 1);
	const frozen = freeze({});
	map = new Map().set(frozen, 42);
	t.is(map.get(frozen), 42);
});

test('Map#size', t => {
	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'size'));
	const map = new Map();
	map.set(2, 1);
	const {size} = map;
	t.is(typeof size, 'number', 'size is number');
	t.is(size, 1, 'size is correct');
	if (DESCRIPTORS) {
		const sizeDescriptor = getOwnPropertyDescriptor(Map.prototype, 'size');
		t.truthy(sizeDescriptor && sizeDescriptor.get, 'size is getter');
		t.truthy(sizeDescriptor && !sizeDescriptor.set, 'size isnt setter');
		t.throws(() => Map.prototype.size, TypeError);
	}
});

test('Map#@@toStringTag', t => {
	t.is(
		Map.prototype[Symbol.toStringTag],
		'Map',
		'Map::@@toStringTag is `Map`'
	);
	t.is(
		String(new Map()),
		'[object Map]',
		'correct stringification'
	);
});

test('Map Iterator', t => {
	const map = new Map();
	map.set('a', 1);
	map.set('b', 2);
	map.set('c', 3);
	map.set('d', 4);
	const results = [];
	const iterator = map.keys();
	t.true(isIterator(iterator));
	t.false(Object.prototype.propertyIsEnumerable.call(iterator, 'next'));
	t.false(Object.prototype.propertyIsEnumerable.call(iterator, Symbol.iterator));
	results.push(iterator.next().value);
	t.true(map.delete('a'));
	t.true(map.delete('b'));
	t.true(map.delete('c'));
	map.set('e');
	results.push(iterator.next().value);
	results.push(iterator.next().value);
	t.true(iterator.next().done);
	map.set('f');
	t.true(iterator.next().done);
	t.deepEqual(results, ['a', 'd', 'e']);
});

test('Map#keys', t => {
	t.is(typeof Map.prototype.keys, 'function');
	t.is(Map.prototype.keys.name, 'keys');
	t.is(Map.prototype.keys.length, 0);
	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'keys'));
	const map = new Map();
	map.set('a', 'q');
	map.set('s', 'w');
	map.set('d', 'e');
	const iterator = map.keys();
	t.true(isIterator(iterator));
	t.is(iterator[Symbol.toStringTag], 'Map Iterator');
	t.deepEqual(iterator.next(), {
		value: 'a',
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: 's',
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: 'd',
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: undefined,
		done: true
	});
});

test('Map#values', t => {
	t.is(typeof Map.prototype.values, 'function');
	t.is(Map.prototype.values.name, 'values');
	t.is(Map.prototype.values.length, 0);
	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'values'));
	const map = new Map();
	map.set('a', 'q');
	map.set('s', 'w');
	map.set('d', 'e');
	const iterator = map.values();
	t.true(isIterator(iterator));
	t.is(iterator[Symbol.toStringTag], 'Map Iterator');
	t.deepEqual(iterator.next(), {
		value: 'q',
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: 'w',
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: 'e',
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: undefined,
		done: true
	});
});

test('Map#entries', t => {
	t.is(typeof Map.prototype.entries, 'function');
	t.is(Map.prototype.entries.name, 'entries');
	t.is(Map.prototype.entries.length, 0);
	t.false(Object.prototype.propertyIsEnumerable.call(Map.prototype, 'entries'));
	const map = new Map();
	map.set('a', 'q');
	map.set('s', 'w');
	map.set('d', 'e');
	const iterator = map.entries();
	t.true(isIterator(iterator));
	t.is(iterator[Symbol.toStringTag], 'Map Iterator');
	t.deepEqual(iterator.next(), {
		value: ['a', 'q'],
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: ['s', 'w'],
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: ['d', 'e'],
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: undefined,
		done: true
	});
});

test('Map#@@iterator', t => {
	t.is(Map.prototype.entries.name, 'entries');
	t.is(Map.prototype.entries.length, 0);
	t.is(Map.prototype[Symbol.iterator], Map.prototype.entries);
	const map = new Map();
	map.set('a', 'q');
	map.set('s', 'w');
	map.set('d', 'e');
	const iterator = map[Symbol.iterator]();
	t.true(isIterator(iterator));
	t.is(iterator[Symbol.toStringTag], 'Map Iterator');
	t.is(String(iterator), '[object Map Iterator]');
	t.deepEqual(iterator.next(), {
		value: ['a', 'q'],
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: ['s', 'w'],
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: ['d', 'e'],
		done: false
	});
	t.deepEqual(iterator.next(), {
		value: undefined,
		done: true
	});
});
