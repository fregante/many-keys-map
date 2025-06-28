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
};

export default config;
