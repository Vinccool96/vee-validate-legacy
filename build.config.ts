import { defineBuildConfig } from "unbuild"

export default defineBuildConfig({
  entries: [
    "src/index",
    "src/index.full",
    "src/types",
    {
      builder: "mkdist",
      input: "./src/rules",
      outDir: "./dist/rules",
    },
  ],
  declaration: true,
})
