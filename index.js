const nullKey = Symbol('null'); // `objectHashes` key for null

let keyCounter = 0;

export default class ManyKeysMap extends Map {
	constructor() {
		super();

		this._objectHashes = new WeakMap();
		this._symbolHashes = new Map(); // https://github.com/tc39/ecma262/issues/1194
		this._publicKeys = new Map();

		const [pairs] = arguments; // Map compat
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

	_getPublicKeys(keys, create = false) {
		if (!Array.isArray(keys)) {
			throw new TypeError('The keys parameter must be an array');
		}

		const privateKey = this._getPrivateKey(keys, create);

		let publicKey;
		if (privateKey && this._publicKeys.has(privateKey)) {
			publicKey = this._publicKeys.get(privateKey);
		} else if (create) {
			publicKey = [...keys]; // Regenerate keys array to avoid external interaction
			this._publicKeys.set(privateKey, publicKey);
		}

		return {privateKey, publicKey};
	}

	_getPrivateKey(keys, create = false) {
		const privateKeys = [];
		for (let key of keys) {
			if (key === null) {
				key = nullKey;
			}

			const hashes = typeof key === 'object' || typeof key === 'function' ? '_objectHashes' : (typeof key === 'symbol' ? '_symbolHashes' : false);

			if (!hashes) {
				privateKeys.push(key);
			} else if (this[hashes].has(key)) {
				privateKeys.push(this[hashes].get(key));
			} else if (create) {
				const privateKey = `@@mkm-ref-${keyCounter++}@@`;
				this[hashes].set(key, privateKey);
				privateKeys.push(privateKey);
			} else {
				return false;
			}
		}

		return JSON.stringify(privateKeys);
	}

	set(keys, value) {
		const {publicKey} = this._getPublicKeys(keys, true);
		return super.set(publicKey, value);
	}

	get(keys) {
		const {publicKey} = this._getPublicKeys(keys);
		return super.get(publicKey);
	}

	has(keys) {
		const {publicKey} = this._getPublicKeys(keys);
		return super.has(publicKey);
	}

	delete(keys) {
		const {publicKey, privateKey} = this._getPublicKeys(keys);
		return Boolean(publicKey && super.delete(publicKey) && this._publicKeys.delete(privateKey));
	}

	clear() {
		super.clear();
		this._symbolHashes.clear();
		this._publicKeys.clear();
	}

	get [Symbol.toStringTag]() {
		return 'ManyKeysMap';
	}

	get size() {
		return super.size;
	}
}
