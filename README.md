# ENG / SENG / CENG Project

This workspace contains a simple toy language `heng` (ENG), plus two English-like DSLs:

- `seng` — English-like JavaScript (translates to `.js`); syntax now leans more toward Python, with optional parentheses and colon-based blocks. Keywords are case‑insensitive and common misspellings are auto‑corrected; null/none variants are tolerated.
- `ceng` — English-like CSS (translates to `.css`); braces are optional and blocks are inferred from indentation

How to build the example bounce page:

```powershell
node seng/compiler.js examples/bounce.seng
node ceng/compiler.js examples/bounce.ceng
node compiler/compiler.js examples/bounce.heng
```

Commands are defined in `package.json`:

- `npm run build:heng` — build `examples/bounce.heng` into `examples/bounce.html`
- `npm run build:examples` — compile the demo example files and produce `examples/bounce.html`
- `npm run examples:programmatic` — run the programmatic example that compiles `examples/bounce.heng`
- `npm test` — run a simple compile test that verifies the main compiler

Documentation is available in the `documentation/` folder — start with `documentation/USAGE.md` for complete usage and developer notes.

If anything else is missing, tell me which files you expect and I will restore them next.
