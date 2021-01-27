module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    "@nuxtjs/eslint-config-typescript",
    "prettier",
    "prettier/vue",
    "plugin:prettier/recommended",
    "plugin:nuxt/recommended",
  ],
  plugins: ["prettier"],
  // add your custom rules here
  rules: {
    "nuxt/no-cjs-in-config": "off",
    "unicorn/number-literal-case": "off",
    "space-before-function-paren": [
      "error",
      {
        anonymous: "never",
        named: "never",
        asyncArrow: "always",
      },
    ],
    "require-await": "off",
    "no-undef": "off",
    "no-use-before-define": "off",
    "no-console": "off",
    "no-debugger": "off",
  },
  ignorePatterns: ["vue-shim.d.ts"],
};
