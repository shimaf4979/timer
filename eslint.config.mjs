import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});



const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["**/*"], // すべてのファイルを無視
  },
  {
    files: ["**/*.js", "**/*.ts"],
    rules: {
      // ルールを無効化する場合はここで設定
    },
  },
];


export default eslintConfig;
