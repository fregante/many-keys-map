const config = {
	preset: 'ts-jest/presets/default-esm',
	testEnvironment: 'node',
	extensionsToTreatAsEsm: ['.ts'],
	transform: {
		'^.+\\.(ts|js)$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},
	moduleNameMapper: {},
	testMatch: ['**/test-core-js.js', '**/?(*.)+(test).[jt]s?(x)'],
};

export default config;
