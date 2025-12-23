# Usage Guide — ENG / SENG / CENG 🔧

This document explains how to use the project tools to compile `.heng`, `.seng`, and `.ceng` sources, both from the command line and programmatically.

## Summary of components

- `heng` (ENG) — the main language. Files use `.heng` and compile to `.html` via the main compiler in `compiler/compiler.js`.
- `seng` — an English-flavored JS DSL that compiles to `.js` (compiler: `seng/compiler.js`). Supports some English macros and `@raw` passthrough.
- `ceng` — an English-flavored CSS DSL that compiles to `.css` (compiler: `ceng/compiler.js`). Also supports `@raw` passthrough.

## Requirements

- Node.js 14 or newer (project `package.json` states `node >= 14`).
- No additional dependencies — these are plain Node scripts.

## Running compilers from the CLI

The compilers are runnable directly with Node.

- Compile a `.heng` file (main compiler):

  ```powershell
  node compiler/compiler.js <inputFile.heng> [outputFile.html]
  ```

  Example:

  ```powershell
  node compiler/compiler.js examples/bounce.heng
  ```

- Compile a `.seng` file (Seng → JS):

  ```powershell
  node seng/compiler.js <input.seng>
  ```

  Example:

  ```powershell
  node seng/compiler.js examples/bounce.seng
  ```

- Compile a `.ceng` file (Ceng → CSS):

  ```powershell
  node ceng/compiler.js <input.ceng>
  ```

  Example:

  ```powershell
  node ceng/compiler.js examples/bounce.ceng
  ```

Each compiler writes a corresponding `.html` / `.js` / `.css` file in the same folder by default and prints success or error messages to the console.

## npm scripts

Some convenience scripts are included in `package.json`:

- `npm run build:heng` — compiles `examples/bounce.heng` into `examples/bounce.html`.
- `npm run build:examples` — compiles demo `seng`, `ceng`, and `heng` examples in sequence.

Use `npm run <script>` to run any listed script.

## Important behaviors and features

- Imports: the main `EngCompiler` will **precompile** `.seng` and `.ceng` files referenced by imports in `.heng` sources. The precompiled output is attached to the AST import node as `attributes.compiled` (and importType set to `seng` or `ceng`). If compilation of an import fails, the compiler logs a warning but continues.

- Raw passthrough: both `.seng` and `.ceng` recognize a `@raw` marker at the top of the file. If a file begins with `@raw` (first non-empty line), the compiler writes the file content (after the marker) directly to the compiled output without further translation. This is useful for including pre-written JS/CSS.

- CLI usage messages are printed when required arguments are missing — e.g., `Usage: node compiler.js <input.seng>` or `Usage: node compiler.js <input.ceng>`.

## Programmatic API

You can use the main compiler programmatically (for embedding in scripts or build tools):

Example:

```javascript
const EngCompiler = require('./compiler/compiler');
const c = new EngCompiler();

const result = c.compileFile('examples/bounce.heng');
if (result.success) {
  console.log('Wrote:', result.outputPath);
} else {
  console.error('Compile failed:', result.error);
}
```

The `EngCompiler.compile` method also accepts a string of source code and an optional base path for resolving imports. It returns `{ success, html, error }` for direct usage.

## Examples (Bounce demo)

A quick sequence to build the demo page (same as top-level README):

```powershell
node seng/compiler.js examples/bounce.seng
node ceng/compiler.js examples/bounce.ceng
node compiler/compiler.js examples/bounce.heng
```

After running these, you should have `examples/bounce.html`, `examples/bounce.js` and `examples/bounce.css` (or the `.js` / `.css` files produced by the compilers).

## Debugging and tips

- Confirm file extensions are correct (`.heng`, `.seng`, `.ceng`). The compilers validate and expect those extensions.
- Read console logs — compilers print success/failure lines and warnings for failed import compilation.
- For more visibility during development, add `console.log(...)` statements in `compiler/*` files to inspect the AST, tokens, or generated output.
- If an import fails to compile, the main compiler will warn but try to continue. Fix the imported file first to resolve import-related issues.

## Extending the compilers

- `seng` compiler contains a set of English macros and translation rules in `seng/compiler.js` — add more regex replacements or parsing rules to extend behavior.
- `ceng` has keyword-to-CSS translations and simple selector handling — edit `ceng/compiler.js` to add new shorthand mappings.
- The main compiler (in `compiler/`) orchestrates lexing, parsing, and code generation. To change the `.heng` language, update `lexer.js`, `parser.js`, and `codegen.js` as appropriate.

## Contributing

- Fork, make a branch, and open a pull request.
- Add tests (or an example file) for new language features where appropriate.
- If you'd like, I can add a CONTRIBUTING.md and some basic automated tests.

## License & attribution

There is no license file in the project directory by default. Add a `LICENSE` file if you want to publish or distribute the project (MIT or Apache-2.0 are common choices).

---

If you want, I can:
- Add a short `CONTRIBUTING.md` and `LICENSE` file, or
- Create example scripts that demonstrate programmatic usage, or
- Add a `docs/` HTML preview or rendered site.

Tell me which additions you'd like and I’ll implement them.