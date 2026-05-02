import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


export default [
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: { globals: { ...globals.browser, ...globals.node }}},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "i18next",
              importNames: ["t"],
              message:
                "Do not import { t } from 'i18next'; import the initialized instance (src/common/i18n) and use i18n.t(...).",
            },
          ],
        },
      ],
    },
  },
];