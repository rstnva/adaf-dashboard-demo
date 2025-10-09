export default {
  files: ["src/components/academy/**/*.{js,jsx,ts,tsx}"],
  rules: {
    "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-empty": "error",
    "no-case-declarations": "error",
    "react-hooks/exhaustive-deps": "error"
  }
};
