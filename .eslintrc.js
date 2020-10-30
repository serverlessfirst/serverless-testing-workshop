// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  extends: [
    'airbnb-typescript/base',
  ],
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  env: {
    browser: false,
    jest: true,
    node: true,
    es6: true,
  },
  rules: {
    // Override some of the Airbnb rules
    '@typescript-eslint/indent': ['error', 2, {
      SwitchCase: 1,
    }],
    'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: true }],
    'implicit-arrow-linebreak': ['off'],
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-use-before-define': ['error', 'nofunc'],
    'no-nested-ternary': ['off'],
    'prefer-destructuring': 'off',
    '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: false }],
    'import/prefer-default-export': ['off'],
    'arrow-parens': ['error', 'as-needed', { requireForBlockBody: true }],
    'function-paren-newline': ['error', 'consistent'],
    'max-len': ['error', {
      code: 120, ignoreComments: true, ignoreTemplateLiterals: true, ignoreStrings: true,
    }],
    '@typescript-eslint/no-non-null-assertion': 'off',
    'linebreak-style': 'off',
  },
  settings: {
    // Allow individual service folders to provide their own aliases for absolute imports
    'import/resolver': {
      node: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
      typescript: {
        project: 'services/*/tsconfig.json',
      },
    },
    'import/core-modules': [
      'aws-lambda',
    ],
  },
};
