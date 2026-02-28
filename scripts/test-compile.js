// Simple test script: compile examples/bounce.heng and assert output exists
const path = require('path');
const fs = require('fs');
const EngCompiler = require('../compiler/compiler');

// compile a heng file
const input = path.join(__dirname, '..', 'examples', 'bounce.heng');
const compiler = new EngCompiler();
let res = compiler.compileFile(input);

if (!res.success) {
  console.error('Test failed: heng compile returned error:', res.error);
  process.exit(1);
}
if (!fs.existsSync(res.outputPath)) {
  console.error('Test failed: heng output not found at', res.outputPath);
  process.exit(1);
}

// compile a seng file using its own compiler
const seng = require('../seng/compiler');
res = seng(path.join(__dirname, '..', 'examples', 'example.seng'));
if (!fs.existsSync(path.join(__dirname, '..', 'examples', 'example.js'))) {
  console.error('Test failed: seng output missing');
  process.exit(1);
}
// extra sanity: run a tiny snippet with typos to ensure normalization happens
const tmp = path.join(__dirname, 'tmp.seng');
fs.writeFileSync(tmp, 'funcion test\n  varibal x = null\n  log x');
res = seng(tmp);
if (!res.includes('function test')) {
  console.error('Test failed: typo normalization not applied');
  process.exit(1);
}
fs.unlinkSync(tmp);

// compile a ceng file
const ceng = require('../ceng/compiler');
res = ceng(path.join(__dirname, '..', 'examples', 'example.ceng'));
if (!fs.existsSync(path.join(__dirname, '..', 'examples', 'example.css'))) {
  console.error('Test failed: ceng output missing');
  process.exit(1);
}

console.log('Test passed:', res.outputPath);
process.exit(0);