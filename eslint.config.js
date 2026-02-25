import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    {
        languageOptions: {
            globals: { ...globals.browser },
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        rules: {
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-debugger': 'error',
            'prefer-const': 'error',
            'no-var': 'error',
        },
    },
];
