import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Playwright fixtures call a function named `use`, which isn't a React hook.
    files: ['tests/e2e/**/*.ts'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
  {
    ignores: [
      '.next/',
      'node_modules/',
      '.claude/',
      'src/payload-types.ts',
      'src/migrations/',
      'src/app/(payload)/',
      'next-env.d.ts',
    ],
  },
]

export default eslintConfig
