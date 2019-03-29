# many-keys-map [![(size)][badge-gzip]](#no-link) [![(status)][badge-travis]][link-travis]

  [badge-gzip]: https://img.shields.io/bundlephobia/minzip/many-keys-map.svg?label=gzipped
  [badge-travis]: https://api.travis-ci.com/bfred-it/many-keys-map.svg?branch=master
  [link-travis]: https://travis-ci.org/bfred-it/many-keys-map
  [link-npm]: https://www.npmjs.com/package/many-keys-map

> A `Map` subclass with support for multiple keys for one entry.

A `ManyKeysMap` object is identical to a regular `Map`, which the exception that it only supports a _sequence of keys_ as key, instead of a single key. This will let you attach a value to a specific combination of keys, instead of a single key.

```js
const regularMap = new Map();
regularMap.set('hello', true);

const manyKeysMap = new ManyKeysMap();
manyKeysMap.set(['hello', 'world'], true);
```

This is useful when the keys cannot be easily combined (i.e. object)

```js
const handlers = new ManyKeysMap();
handlers.set([element, 'click'], onClickFn);
handlers.set([element, 'keypress', {passive: true}], onKeypressFn);
// Since objects are stored by reference, it’s best to stringify `options` object like the above
handlers.set([element, 'keypress', JSON.stringify({passive: true})], onKeypressFn);
```

The number of keys allowed is unlimited and their order is relevant.

## Install

```
$ npm install many-keys-map
```


## Usage

It should work exactly the same as a `Map`, except that the `key` must always be an array.

```js
const ManyKeysMap = require('many-keys-map');

const groups = new ManyKeysMap();
groups.set([header, 'admin'], true);
groups.set([target, 'tools'], [1, 'any value is supported']);

const data = new ManyKeysMap([
	[['hello key'], 'value'],
	[[42, null], new Date()]
]);

data.get(['hello key']);
// => 'value'

data.get([42, null]);
// => date Object

data.get(['42']);
// => undefined

data.has([Symbol()]);
// => false

for (const [keys, value] of data) {
	console.log(keys);
	console.log(value);
}
// => ['hello key']
// => 'value'
// => [42, null]
// => date Object
```

### Allowed keys

1. Keys must always be an array, e.g. `.set([a, b], 'hello')`
2. Only the values in the `keys` array are stored, not the array itself — so future changes to the array won’t be reflected in the map.
3. `ManyKeysMap` supports any number of keys, any of these are valid and different: `.get([a])` and `.get([a, b, c, d, e, f, g])`
4. The order of keys is irrelevant, so `.get([a, b])` is different from `.get(b, a)`
5. The keys can be anything supported by `Map`.


# Related

- [many-keys-weakmap](https://github.com/bfred-it/many-keys-weakmap) - A `WeakMap` subclass with support for multiple keys for one entry.
