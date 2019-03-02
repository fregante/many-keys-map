import test from 'ava';
import MultiMap from '.';

test('Basics', t => {
	const map = new MultiMap();
	t.true(map instanceof Map);
	t.is(typeof map[Symbol.iterator], 'function');
	t.is(map.size, 0);
	t.is(map.get.length, 1);
	t.is(map.set.length, 2);
	t.is(map.clear.length, 0);
	t.is(map.delete.length, 1);
	t.deepEqual([...map.entries()], []);
	t.deepEqual([...map.values()], []);
	t.deepEqual([...map.keys()], []);
	map.forEach(t.fail);
});

test('Set', t => {
	const map = new MultiMap();
	map.set(['-'], 'first');
	t.is(map.size, 1);
	map.set(['-'], 'second');
	t.is(map.size, 1);
	map.set([':', '-'], 'third');
	t.is(map.size, 2);
	map.set([':', '-', '%'], 'fourth');
	t.is(map.size, 3);

	// Also make sure that the same map is returned
	t.is(map.set(['#', 'fifth']), map);

	const prefilledMap = new MultiMap([
		[['-'], 'first'],
		[[':', '-'], 'second']
	]);
	t.is(prefilledMap.size, 2);
});

test('Get', t => {
	const map = new MultiMap([
		[['-'], 'first'],
		[[':', '-'], 'second'],
		[[':', '-', '%'], 'third']
	]);

	t.is(map.get(['-']), 'first');
	t.is(map.get([':', '-']), 'second');
	t.is(map.get([':', '-', '%']), 'third');
	t.is(map.get([':']), undefined);
	t.is(map.get([':', '%']), undefined);
	t.is(map.get([':', '%', '-']), undefined);
});

test('Has', t => {
	const map = new MultiMap([
		[['-'], 'first'],
		[[':', '-'], 'second'],
		[[':', '-', '%'], 'third']
	]);

	t.true(map.has(['-']));
	t.true(map.has([':', '-']));
	t.true(map.has([':', '-', '%']));
	t.false(map.has([':']));
	t.false(map.has([':', '%']));
	t.false(map.has([':', '%', '-']));
});

test('Delete', t => {
	const map = new MultiMap([
		[['-'], 'first'],
		[[':', '-'], 'second'],
		[[':', '-', '%'], 'third']
	]);

	t.is(map.size, 3);
	t.true(map.delete(['-']));
	t.is(map.size, 2);
	t.false(map.delete(['-']));
	t.is(map.size, 2);
	t.true(map.delete([':', '-']));
	t.is(map.size, 1);
	t.true(map.delete([':', '-', '%']));
	t.is(map.size, 0);
});

test('Clear', t => {
	const map = new MultiMap([
		[['-'], 'first'],
		[[':', '-'], 'second'],
		[[':', '-', '%'], 'third']
	]);

	t.is(map.size, 3);
	t.is(map.clear(), undefined);
	t.is(map.size, 0);
	t.is(map.clear(), undefined);
	t.is(map.size, 0);
});

test('Iterators', t => {
	const pairs = [
		[['-'], 'first'],
		[[':', '-'], 'second'],
		[[':', '-', '%'], 'third']
	];
	const map = new MultiMap(pairs);
	const regularMap = new Map(pairs);

	t.deepEqual([...map], pairs);
	t.deepEqual([...map.entries()], pairs);

	// The returned values and keys match regular Maps,
	// but in MultiMap, key Arrays are stored by value rather than by reference.
	t.deepEqual([...map.values()], [...regularMap.values()]);
	t.deepEqual([...map.keys()], [...regularMap.keys()]);

	let count = 0;
	map.forEach(() => {
		count++;
	});
	t.is(count, pairs.length);
});

test('All types of keys', t => {
	const map = new MultiMap();

	t.is(map.set([1], 'number').get([1]), 'number');
	t.is(map.size, 1);
	t.true(map.delete([1]));
	t.is(map.size, 0);

	t.is(map.set([true], 'boolean').get([true]), 'boolean');
	t.is(map.size, 1);
	t.true(map.delete([true]));
	t.is(map.size, 0);

	t.is(map.set([undefined], 'undefined').get([undefined]), 'undefined');
	t.is(map.size, 1);
	t.true(map.delete([undefined]));
	t.is(map.size, 0);

	let key = {};
	t.is(map.set([key], 'object').get([key]), 'object');
	t.is(map.size, 1);
	t.true(map.delete([key]));
	t.is(map.size, 0);

	key = [];
	t.is(map.set([key], 'array').get([key]), 'array');
	t.is(map.size, 1);
	t.true(map.delete([key]));
	t.is(map.size, 0);

	key = Symbol('symbol');
	t.is(map.set([key], 'symbol').get([key]), 'symbol');
	t.is(map.size, 1);
	t.true(map.delete([key]));
	t.is(map.size, 0);
});

test('Mixed types of keys', t => {
	const map = new MultiMap();
	map.set([1, '1', true], 'truthy');
	t.is(map.size, 1);
	t.is(map.get([1, '1', true]), 'truthy');
	t.is(map.get([1, '1', 'true']), undefined);
	t.is(map.get(['1', '1', true]), undefined);
	t.is(map.get([1, '1', true, 1]), undefined);
	t.is(map.get([1, 1, 1]), undefined);

	map.set([undefined], 'undefined');
	t.is(map.size, 3);
	t.is(map.get([undefined]), 'undefined');
	t.is(map.get(['undefined']), undefined);
	t.is(map.get([,]), 'undefined'); // eslint-disable-line no-sparse-arrays,comma-spacing

	const key1 = {};
	const key2 = {};
	const key3 = Symbol(3);
	const key4 = Symbol(4);
	map.set([key1, key2, key3, key4], 'references');
	t.is(map.size, 4);
	t.is(map.get([key1, key2, key3, key4]), 'references');
	t.is(map.get([key2, key1, key3, key4]), undefined);
	t.is(map.get([key1, key2, key4, key3]), undefined);
	t.is(map.get([key1, key2, key3, Symbol(4)]), undefined);
});
