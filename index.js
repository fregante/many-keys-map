const createPrivateKey = Symbol('createPrivateKey');
const getPrivateKey = Symbol('getPrivateKey');
const publicKeys = Symbol('publicKeys');
const objectHashes = Symbol('objectHashes');
const symbolHashes = Symbol('symbolHashes');

let keyCounter = 0;

export default class MultiMap extends Map {
	constructor(pairs) {
		super();
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

	[createPrivateKey](keys) {
		return JSON.stringify(keys.map(key => {
			if (typeof key === 'object') {
				if (this[objectHashes].has(key)) {
					return this[objectHashes].get(key);
				}

				keyCounter++;
				this[objectHashes].set(key, keyCounter);
				return keyCounter;
			}

			if (typeof key === 'symbol') {
				if (this[symbolHashes].has(key)) {
					return this[symbolHashes].get(key);
				}

				keyCounter++;
				this[symbolHashes].set(key, keyCounter);
				return keyCounter;
			}

			return key;
		}));
	}

	[getPrivateKey](keys) {
		return JSON.stringify(keys.map(key => {
			if (typeof key === 'object') {
				if (this[objectHashes].has(key)) {
					return this[objectHashes].get(key);
				}

				// Impossible key
				return Math.random() + '.' + Math.random();
			}

			if (typeof key === 'symbol') {
				if (this[symbolHashes].has(key)) {
					return this[symbolHashes].get(key);
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

		const privateKey = this[createPrivateKey](keys);

		let publicKey;
		if (this[publicKeys].has(privateKey)) {
			publicKey = this[publicKeys].get(privateKey);
		} else {
			this[publicKeys].set(privateKey, keys);
			publicKey = keys;
		}

		return super.set(publicKey, value);
	}

	get(keys) {
		if (!Array.isArray(keys)) {
			throw new TypeError('The keys parameter must be an array');
		}

		return super.get(this[publicKeys].get(this[getPrivateKey](keys)));
	}

	has(keys) {
		if (!Array.isArray(keys)) {
			throw new TypeError('The keys parameter must be an array');
		}

		return super.has(this[publicKeys].get(this[getPrivateKey](keys)));
	}

	delete(keys) {
		if (!Array.isArray(keys)) {
			throw new TypeError('The keys parameter must be an array');
		}

		const privateKey = this[getPrivateKey](keys);
		const publicKey = this[publicKeys].get(privateKey);
		return Boolean(publicKey && super.delete(publicKey) && this[publicKeys].delete(privateKey));
	}
}