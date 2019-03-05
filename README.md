# many-keys-map [![Build Status](https://api.travis-ci.com/bfred-it/many-keys-map.svg?branch=master)](https://travis-ci.com/bfred-it/many-keys-map)

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
```

The number of keys allowed is unlimited and their order is relevant.

## Install

```
$ npm install bfred-it/many-keys-map
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


## License

MIT © [Federico Brigante](http://twitter.com/bfred_it)

