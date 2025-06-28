/** @type {import('xo').FlatXoConfig} */
export default [
	{
		files: ['**/*.{js,ts}'],
		languageOptions: {
			globals: {
				describe: 'readonly',
				test: 'readonly',
				it: 'readonly',
				expect: 'readonly',
				beforeAll: 'readonly',
				afterAll: 'readonly',
				beforeEach: 'readonly',
				afterEach: 'readonly',
			},
		},
		rules: {
			'no-new': 0,
			'@stylistic/object-curly-spacing': 'off',
		},
	},
];
