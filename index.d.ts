export default class ManyKeysMap<K extends readonly unknown[], V> extends Map<K, V> {
	/** @private */
	_publicKeys: Map<string, K>;
	/** @private */
	_symbolHashes: Map<symbol, K>;
}
