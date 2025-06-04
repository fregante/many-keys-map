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

import test from 'ava';
import ManyKeysMap from './index.js';

const isIterator = it => typeof it === 'object' && typeof it.next === 'function';

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

test('ManyKeysMap', t => {
	t.is(typeof ManyKeysMap, 'function');
	t.is(ManyKeysMap.length, 0);
	t.is(ManyKeysMap.name, 'ManyKeysMap');
	t.true('clear' in ManyKeysMap.prototype, 'clear in ManyKeysMap.prototype');
	t.true('delete' in ManyKeysMap.prototype, 'delete in ManyKeysMap.prototype');
	t.true('forEach' in ManyKeysMap.prototype, 'forEach in ManyKeysMap.prototype');
	t.true('get' in ManyKeysMap.prototype, 'get in ManyKeysMap.prototype');
	t.true('has' in ManyKeysMap.prototype, 'has in ManyKeysMap.prototype');
	t.true('set' in ManyKeysMap.prototype, 'set in ManyKeysMap.prototype');
	t.true(new ManyKeysMap() instanceof ManyKeysMap, 'new ManyKeysMap instanceof ManyKeysMap');
	t.is(
		new ManyKeysMap(createIterable([[[1], 1], [[2], 2], [[3], 3]])).size,
		3,
		'Init from iterable',
	);
	t.is(
		new ManyKeysMap([[Object.freeze([{}]), 1], [[2], 3]]).size,
		2,
		'Support frozen objects',
	);
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

	t.true(done, '.return #throw');

	// Intentionally instantiating for side effects only
	const array = [];
	done = false;
	array['@@iterator'] = undefined;
	array[Symbol.iterator] = function () {
		done = true;
		return Array.prototype[Symbol.iterator].call(this);
	};
	
	new ManyKeysMap(array);
	t.true(done);

	const object = {};
	new ManyKeysMap().set([object], 1);
	const results = [];
	for (const key of Object.keys(object)) {
		results.push(key);
	}

	t.deepEqual(results, []);
	t.deepEqual(Object.keys(object), []);

	t.deepEqual(Object.getOwnPropertyNames(object), []);
	if (Object.getOwnPropertySymbols) {
		t.deepEqual(Object.getOwnPropertySymbols(object), []);
	}

	t.deepEqual(Reflect.ownKeys(object), []);

	class Subclass extends ManyKeysMap {}
	t.true(
		new Subclass() instanceof Subclass,
		'correct subclassing with native classes #1',
	);
	t.true(
		new Subclass() instanceof ManyKeysMap,
		'correct subclassing with native classes #2',
	);
	t.is(
		new Subclass().set([1], 2).get([1]),
		2,
		'correct subclassing with native classes #3',
	);
});

test('ManyKeysMap#clear', t => {
	t.is(typeof ManyKeysMap.prototype.clear, 'function');
	t.is(ManyKeysMap.prototype.clear.length, 0);
	t.is(ManyKeysMap.prototype.clear.name, 'clear');
	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'clear'));
	let map = new ManyKeysMap();
	map.clear();
	t.is(map.size, 0);
	map = new ManyKeysMap();
	map.set([1], 2);
	map.set([2], 3);
	map.set([1], 4);
	map.clear();
	t.is(map.size, 0);
	t.true(!map.has([1]));
	t.true(!map.has([2]));
	const frozen = [Object.freeze({})];
	map = new ManyKeysMap();
	map.set([1], 2);
	map.set(frozen, 3);
	map.clear();
	t.is(map.size, 0, 'Support frozen objects');
	t.true(!map.has([1]));
	t.true(!map.has(frozen));
});

test('ManyKeysMap#delete', t => {
	t.is(typeof ManyKeysMap.prototype.delete, 'function');
	t.is(ManyKeysMap.prototype.delete.length, 1);
	t.is(ManyKeysMap.prototype.delete.name, 'delete');

	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'delete'));
	const object = {};
	const map = new ManyKeysMap();
	map.set([NaN], 1);
	map.set([2], 1);
	map.set([3], 7);
	map.set([2], 5);
	map.set([1], 4);
	map.set([object], 9);
	t.is(map.size, 5);
	t.true(map.delete([NaN]));
	t.is(map.size, 4);
	t.false(map.delete([4]));
	t.is(map.size, 4);
	map.delete([[]]);
	t.is(map.size, 4);
	map.delete([object]);
	t.is(map.size, 3);
	const frozen = Object.freeze({});
	map.set([frozen], 42);
	t.is(map.size, 4);
	map.delete([frozen]);
	t.is(map.size, 3);
});

test('ManyKeysMap#forEach', t => {
	t.is(typeof ManyKeysMap.prototype.forEach, 'function');
	t.is(ManyKeysMap.prototype.forEach.length, 1);
	t.is(ManyKeysMap.prototype.forEach.name, 'forEach');
	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'forEach'));
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
	t.is(count, 5);
	t.deepEqual(result, {
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
	t.is(result, '0124');
	map = new ManyKeysMap([[['0'], 1]]);
	result = '';
	map.forEach(value => {
		map.delete(['0']);
		if (result !== '') {
			throw new Error('This shouldn’t happen');
		}

		result += value;
	});
	t.is(result, '1');
	t.throws(() => {
		ManyKeysMap.prototype.forEach.call(new Set(), () => {
			/* Empty */
		});
	}, {message: 'Method Map.prototype.forEach called on incompatible receiver #<Set>'});
});

test('ManyKeysMap#get', t => {
	t.is(typeof ManyKeysMap.prototype.get, 'function');
	t.is(ManyKeysMap.prototype.get.name, 'get');
	t.is(ManyKeysMap.prototype.get.length, 1);
	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'get'));
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
	t.is(map.get([NaN]), 1);
	t.is(map.get([4]), undefined);
	t.is(map.get([{}]), undefined);
	t.is(map.get([object]), object);
	t.is(map.get([frozen]), 42);
	t.is(map.get([2]), 5);
});

test('ManyKeysMap#has', t => {
	t.is(typeof ManyKeysMap.prototype.has, 'function');
	t.is(ManyKeysMap.prototype.has.name, 'has');
	t.is(ManyKeysMap.prototype.has.length, 1);
	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'has'));
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
	t.true(map.has([NaN]));
	t.true(map.has([object]));
	t.true(map.has([2]));
	t.true(map.has([frozen]));
	t.true(!map.has([4]));
	t.true(!map.has([{}]));
});

test('ManyKeysMap#set', t => {
	t.is(typeof ManyKeysMap.prototype.set, 'function');
	t.is(ManyKeysMap.prototype.set.name, 'set');
	t.is(ManyKeysMap.prototype.set.length, 2);
	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'set'));
	const object = {};
	let map = new ManyKeysMap();
	map.set([NaN], 1);
	map.set([2], 1);
	map.set([3], 1);
	map.set([2], 5);
	map.set([1], 4);
	map.set([object], object);
	t.true(map.size === 5);
	const chain = map.set([7], 2);
	t.is(chain, map);
	map.set([7], 2);
	t.is(map.size, 6);
	t.is(map.get([7]), 2);
	t.is(map.get([NaN]), 1);
	map.set([NaN], 42);
	t.is(map.size, 6);
	t.is(map.get([NaN]), 42);
	map.set([{}], 11);
	t.is(map.size, 7);
	t.is(map.get([object]), object);
	map.set([object], 27);
	t.is(map.size, 7);
	t.is(map.get([object]), 27);
	map = new ManyKeysMap();
	map.set([NaN], 2);
	map.set([NaN], 3);
	map.set([NaN], 4);
	t.is(map.size, 1);
	const frozen = Object.freeze({});
	map = new ManyKeysMap().set([frozen], 42);
	t.is(map.get([frozen]), 42);
});

test('ManyKeysMap#size', t => {
	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'size'));
	const map = new ManyKeysMap();
	map.set([2], 1);
	const {size} = map;
	t.is(typeof size, 'number', 'size is number');
	t.is(size, 1, 'size is correct');
	const sizeDescriptor = Object.getOwnPropertyDescriptor(ManyKeysMap.prototype, 'size');
	t.truthy(sizeDescriptor && sizeDescriptor.get, 'size is getter');
	t.truthy(sizeDescriptor && !sizeDescriptor.set, 'size isnt setter');
	t.throws(() => ManyKeysMap.prototype.size, {instanceOf: TypeError});
});

test('ManyKeysMap#@@toStringTag', t => {
	t.is(
		ManyKeysMap.prototype[Symbol.toStringTag],
		'ManyKeysMap',
		'ManyKeysMap::@@toStringTag is `ManyKeysMap`',
	);
	t.is(
		String(new ManyKeysMap()),
		'[object ManyKeysMap]',
		'correct stringification',
	);
});

test('ManyKeysMap Iterator', t => {
	const map = new ManyKeysMap();
	map.set(['a'], 1);
	map.set(['b'], 2);
	map.set(['c'], 3);
	map.set(['d'], 4);
	const results = [];
	const iterator = map.keys();
	t.true(isIterator(iterator));
	t.false(Object.prototype.propertyIsEnumerable.call(iterator, 'next'));
	t.false(Object.prototype.propertyIsEnumerable.call(iterator, Symbol.iterator));
	results.push(iterator.next().value);
	t.true(map.delete(['a']));
	t.true(map.delete(['b']));
	t.true(map.delete(['c']));
	map.set(['e']);
	results.push(
		iterator.next().value,
		iterator.next().value,
	);
	t.true(iterator.next().done);
	map.set(['f']);
	t.true(iterator.next().done);
	t.deepEqual(results, [['a'], ['d'], ['e']]);
});

test('ManyKeysMap#keys', t => {
	t.is(typeof ManyKeysMap.prototype.keys, 'function');
	t.is(ManyKeysMap.prototype.keys.name, 'keys');
	t.is(ManyKeysMap.prototype.keys.length, 0);
	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'keys'));
	const map = new ManyKeysMap();
	map.set(['a'], 'q');
	map.set(['s'], 'w');
	map.set(['d'], 'e');
	const iterator = map.keys();
	t.true(isIterator(iterator));
	t.is(iterator[Symbol.toStringTag], 'Map Iterator');
	t.deepEqual(iterator.next(), {
		value: ['a'],
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: ['s'],
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: ['d'],
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: undefined,
		done: true,
	});
});

test('ManyKeysMap#values', t => {
	t.is(typeof ManyKeysMap.prototype.values, 'function');
	t.is(ManyKeysMap.prototype.values.name, 'values');
	t.is(ManyKeysMap.prototype.values.length, 0);
	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'values'));
	const map = new ManyKeysMap();
	map.set(['a'], 'q');
	map.set(['s'], 'w');
	map.set(['d'], 'e');
	const iterator = map.values();
	t.true(isIterator(iterator));
	t.is(iterator[Symbol.toStringTag], 'Map Iterator');
	t.deepEqual(iterator.next(), {
		value: 'q',
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: 'w',
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: 'e',
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: undefined,
		done: true,
	});
});

test('ManyKeysMap#entries', t => {
	t.is(typeof ManyKeysMap.prototype.entries, 'function');
	t.is(ManyKeysMap.prototype.entries.name, 'entries');
	t.is(ManyKeysMap.prototype.entries.length, 0);
	t.false(Object.prototype.propertyIsEnumerable.call(ManyKeysMap.prototype, 'entries'));
	const map = new ManyKeysMap();
	map.set(['a'], 'q');
	map.set(['s'], 'w');
	map.set(['d'], 'e');
	const iterator = map.entries();
	t.true(isIterator(iterator));
	t.is(iterator[Symbol.toStringTag], 'Map Iterator');
	t.deepEqual(iterator.next(), {
		value: [['a'], 'q'],
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: [['s'], 'w'],
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: [['d'], 'e'],
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: undefined,
		done: true,
	});
});

test('ManyKeysMap#@@iterator', t => {
	t.is(ManyKeysMap.prototype.entries.name, 'entries');
	t.is(ManyKeysMap.prototype.entries.length, 0);
	t.is(ManyKeysMap.prototype[Symbol.iterator], ManyKeysMap.prototype.entries);
	const map = new ManyKeysMap();
	map.set(['a'], 'q');
	map.set(['s'], 'w');
	map.set(['d'], 'e');
	const iterator = map[Symbol.iterator]();
	t.true(isIterator(iterator));
	t.is(iterator[Symbol.toStringTag], 'Map Iterator');
	t.is(String(iterator), '[object Map Iterator]');
	t.deepEqual(iterator.next(), {
		value: [['a'], 'q'],
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: [['s'], 'w'],
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: [['d'], 'e'],
		done: false,
	});
	t.deepEqual(iterator.next(), {
		value: undefined,
		done: true,
	});
});
