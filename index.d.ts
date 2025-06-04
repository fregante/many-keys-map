// eslint-disable-next-line @typescript-eslint/ban-types -- It matches Map’s
export default class ManyKeysMap<K, V> extends Map<K[], V> {}
