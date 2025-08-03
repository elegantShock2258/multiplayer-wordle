module.exports = {
  // Type check TypeScript files
  "**/*.(ts|tsx)": () => "yarn tsc",

  // Lint & Prettify TS and JS files
  "**/*.(ts|tsx|js)": (filenames) => [
    //     `yarn eslint ${filenames.join(" ")}`,
    `yarn prettier --write ${filenames.join(" ")}`,
    "yarn run lint",
    "yarn run build",
  ],

  // Prettify only Markdown and JSON files
  "**/*.(md|json)": (filenames) =>
    `yarn prettier --write ${filenames.join(" ")}`,
};
