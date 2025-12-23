// Simple test script: compile examples/bounce.heng and assert output exists
const path = require('path');
const fs = require('fs');
const EngCompiler = require('../compiler/compiler');

const input = path.join(__dirname, '..', 'examples', 'bounce.heng');
const compiler = new EngCompiler();
const res = compiler.compileFile(input);

if (!res.success) {
  console.error('Test failed: compile returned error:', res.error);
  process.exit(1);
}

if (!fs.existsSync(res.outputPath)) {
  console.error('Test failed: expected output not found at', res.outputPath);
  process.exit(1);
}

console.log('Test passed:', res.outputPath);
process.exit(0);