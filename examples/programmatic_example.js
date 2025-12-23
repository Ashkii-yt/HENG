// Programmatic example: compile examples/bounce.heng using the EngCompiler
const path = require('path');
const EngCompiler = require('../compiler/compiler');

const inputPath = path.join(__dirname, 'bounce.heng');
const compiler = new EngCompiler();

const result = compiler.compileFile(inputPath);
if (result.success) {
  console.log('✓ Programmatic compile succeeded:', result.outputPath);
  process.exit(0);
} else {
  console.error('✗ Programmatic compile failed:', result.error);
  process.exit(1);
}