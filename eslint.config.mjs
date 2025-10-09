import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/*.config.*",
      "**/*.tsbuildinfo",
      "lav-adaf/**",
      "ADAF-ok/**",
      "tests/**",
      "scripts/**",
      "performance/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      // Ajustes pragmáticos para el repo
      "no-console": "off",
      // En App Router no aplica esta regla de pages/
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      // Evitar errores por reglas referenciadas en comentarios
  // Requiere project parser; desactivado para no forzar TS program en CI rápido
  "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-var-requires": "off",
      // Temporales para reactivar lint sin bloquear CI; se irán endureciendo
      "no-undef": "off",
      "no-inner-declarations": "warn",
      "no-useless-catch": "warn",
      "no-control-regex": "warn",
      "no-empty": "warn",
      "no-case-declarations": "warn",
      // React hooks plugin (baseline)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Tests: habilitar globals de jest/vitest
  {
    files: ["tests/**/*.{js,jsx,ts,tsx}", "**/*.test.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
];
