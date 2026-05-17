import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    extends: [
      ...pluginVue.configs['flat/recommended'],
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  skipFormatting,
)
