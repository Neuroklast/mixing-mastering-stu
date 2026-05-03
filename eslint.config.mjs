// ESLint 9 flat config — required because `next lint` was removed in Next.js 16.
// Run linting with: npm run lint  (which now calls `eslint .`)
import nextConfig from 'eslint-config-next'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextConfig,
  {
    // Ignore generated / build artefacts and test infrastructure config.
    ignores: ['tsconfig.tsbuildinfo', 'payload-types.ts'],
  },
]

export default config
