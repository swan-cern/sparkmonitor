module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'plugin:react/recommended',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off', // Typescript can infer return values for react components. Simplifies syntax
        '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
        curly: ['error', 'all'],
        eqeqeq: 'error',
        'prefer-arrow-callback': 'error',
    },
    settings: {
        react: {
            version: 'latest',
        },
    },
    ignorePatterns: ['.eslintrc.js', 'prettier.config.js'],
};
