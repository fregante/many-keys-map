'use strict';

const getInternalKeys = Symbol('getInternalKeys');
const getPrivateKey = Symbol('getPrivateKey');
const publicKeys = Symbol('publicKeys');
const objectHashes = Symbol('objectHashes');
const symbolHashes = Symbol('symbolHashes');
const nullKey = Symbol('null'); // WeakMap key for null

let keyCounter = 0;

module.exports = class MultiKeyMap extends Map {
	constructor() {
		super();

		// eslint-disable-next-line prefer-rest-params
		const [pairs] = arguments; // Map compat
		this[objectHashes] = new WeakMap();
		this[symbolHashes] = new Map(); // https://github.com/tc39/ecma262/issues/1194
		this[publicKeys] = new Map();

		if (pairs === null || pairs === undefined) {
			return;
		}

		if (typeof pairs[Symbol.iterator] !== 'function') {
			throw new TypeError(typeof pairs + ' is not iterable (cannot read property Symbol(Symbol.iterator))');
		}

		for (const [keys, value] of pairs) {
			this.set(keys, value);
		}
	}

	[getInternalKeys](keys, create = false) {
		const privateKey = this[getPrivateKey](keys, create);

		let publicKey;
		if (this[publicKeys].has(privateKey)) {
			publicKey = this[publicKeys].get(privateKey);
		} else if (create) {
			this[publicKeys].set(privateKey, keys);
			publicKey = keys;
		}

		return {privateKey, publicKey};
	}

	[getPrivateKey](keys, create = false) {
		return JSON.stringify(keys.map(key => {
			if (key === null) {
				key = nullKey;
			}

			const hashes = typeof key === 'object' ? objectHashes : typeof key === 'symbol' ? symbolHashes : false;

			if (hashes) {
				if (this[hashes].has(key)) {
					return this[hashes].get(key);
				}

				if (create) {
					const privateKey = `@@mkm-ref-${keyCounter++}@@`;
					this[hashes].set(key, privateKey);
					return privateKey;
				}

				// Impossible key
				return Math.random() + '.' + Math.random();
			}

			return key;
		}));
	}

	set(keys, value) {
		if (!Array.isArray(keys)) {
			throw new TypeError('The keys parameter must be an array');
		}

		const {publicKey} = this[getInternalKeys](keys, true);
		return super.set(publicKey, value);
	}

	get(keys) {
		if (!Array.isArray(keys)) {
			throw new TypeError('The keys parameter must be an array');
		}

		const {publicKey} = this[getInternalKeys](keys);
		return super.get(publicKey);
	}

	has(keys) {
		if (!Array.isArray(keys)) {
			throw new TypeError('The keys parameter must be an array');
		}

		const {publicKey} = this[getInternalKeys](keys);
		return super.has(publicKey);
	}

	delete(keys) {
		if (!Array.isArray(keys)) {
			throw new TypeError('The keys parameter must be an array');
		}

		const {publicKey, privateKey} = this[getInternalKeys](keys);
		return Boolean(publicKey && super.delete(publicKey) && this[publicKeys].delete(privateKey));
	}

	get [Symbol.toStringTag]() {
		return 'MultiKeyMap';
	}

	get size() {
		return super.size;
	}
};
