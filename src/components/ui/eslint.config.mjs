export default {
  files: ["src/components/ui/**/*.{js,jsx,ts,tsx}"],
  rules: {
    "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-empty": "error",
    "no-case-declarations": "error",
    "react-hooks/exhaustive-deps": "error"
  }
};
