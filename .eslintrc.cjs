module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:security/recommended",
    "plugin:sonarjs/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "security", "sonarjs"],
  rules: {
    "@typescript-eslint/no-unused-vars": "warn",
    "complexity": ["warn", 10],
    "sonarjs/cognitive-complexity": ["warn", 15],
    "max-lines": ["warn", { max: 400 }],
    "security/detect-object-injection": "off", // a veces da falsos positivos en Express
  },
};
