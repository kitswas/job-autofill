module.exports = [
	{
		files: ["**/*.{js,jsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			parserOptions: { ecmaFeatures: { jsx: true } },
		},
		plugins: { react: require("eslint-plugin-react") },
		rules: {},
	},
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: "module",
			parser: { parseForESLint: require("@typescript-eslint/parser").parseForESLint },
			parserOptions: { ecmaFeatures: { jsx: true } },
		},
		plugins: { "@typescript-eslint": require("@typescript-eslint/eslint-plugin") },
		rules: {},
	},
];
