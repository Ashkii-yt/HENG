/** Simple Seng Compiler - Direct English to JavaScript translation */

const fs = require('fs');
const path = require('path');

function compileSeng(inputPath) {
  try {
    const source = fs.readFileSync(inputPath, 'utf-8');
    // Support raw passthrough: a .seng file that starts with '@raw' will be returned as-is (after the marker)
    if (source.trim().startsWith('@raw')) {
      const raw = source.split('\n').slice(1).join('\n');
      const outputPath = inputPath.replace('.seng', '.js');
      fs.writeFileSync(outputPath, raw);
      console.log(`✓ Seng (raw) passthrough: ${outputPath}`);
      return raw;
    }
    let output = '';

    // Preprocess some English macros to make seng more expressive
    let pre = source;
    // normalize common typos/alternate words to canonical keywords
    const normalize = (line) => {
      return line
        .replace(/\bfunction\b/i, 'function') // just ensure case
        .replace(/\bfonction\b/i, 'function')
        .replace(/\bfuncion\b/i, 'function')
        .replace(/\bvaribal\b/i, 'var')
        .replace(/\bvarible\b/i, 'var')
        .replace(/\bvarible\b/i, 'var')
        .replace(/\blooping\b/i, 'loop')
        .replace(/\bwheen\b/i, 'when')
        .replace(/\bwhn\b/i, 'when')
        .replace(/\belsee\b/i, 'else')
        .replace(/\bnone\b/i, 'null');
    };
    // apply normalization line-by-line before further processing
    pre = pre.split('\n').map(normalize).join('\n');

    // DOM selectors
    pre = pre.replace(/get element by id\s+["']([^"']+)["']/gi, `document.getElementById("$1")`);
    pre = pre.replace(/get element by selector\s+["']([^"']+)["']/gi, `document.querySelector("$1")`);
    // requestAnimationFrame shorthand: 'requestAnimationFrame loop' or 'request animation frame loop'
    pre = pre.replace(/requestAnimationFrame\s+(\w+)/gi, `requestAnimationFrame($1)`);
    pre = pre.replace(/request animation frame\s+(\w+)/gi, `requestAnimationFrame($1)`);
    // for-from-to: 'for i from 0 to 4' -> for (let i = 0; i <= 4; i++) {
    pre = pre.replace(/for\s+(\w+)\s+from\s+(\d+)\s+to\s+(\d+)/gi, `for (let $1 = $2; $1 <= $3; $1++) {`);

    const lines = pre.split('\n');
    const blockStack = [];
    let i = 0;

    const pushBlock = (openStmt) => blockStack.push(openStmt);
    const popBlock = () => blockStack.pop();

    while (i < lines.length) {
      let raw = lines[i];
      // remove inline comments
      if (raw.indexOf('--') !== -1) raw = raw.split('--')[0];
      let line = raw.trim();

      // If we're inside a class and we hit a top-level construct, close class/methods
      const topLevelStart = /^(function|class|for\s+|on\s+|import\s+|add\s+|create\s+|requestAnimationFrame\b|request animation frame\b)/i;
      if (blockStack.includes('class') && topLevelStart.test(line)) {
        while (blockStack.length) {
          const closed = popBlock();
          if (closed === 'event') output += '});\n'; else output += '}\n';
        }
      }

      // blank line
      if (!line) {
        if (blockStack.length) {
          const closed = popBlock();
          if (closed === 'event') output += '});\n'; else output += '}\n';
        }
        i++;
        continue;
      }

      // Function declaration: 'function name', optionally with params either in parens or space-separated
      const fnMatch = line.match(/^function\s+(\w+)(?:\s*\(([^)]*)\)|\s+([^:]+))?\s*:??/i);
      if (fnMatch) {
        const name = fnMatch[1];
        let params = '';
        if (fnMatch[2] !== undefined && fnMatch[2] !== null) params = fnMatch[2].trim();
        else if (fnMatch[3] !== undefined && fnMatch[3] !== null) params = fnMatch[3].trim();
        // close any open blocks before starting a new top-level function
        while (blockStack.length) {
          const closed = popBlock();
          if (closed === 'event') output += '});\n'; else output += '}\n';
        }
        output += `function ${name}(${params}) {\n`;
        pushBlock('function');
        i++;
        continue;
      }

      // Method declaration inside class: 'constructor(...)' or 'name(...)' or 'static name(...)'
      const methodMatch = line.match(/^(static\s+)?(\w+)\s*\(([^)]*)\)\s*$/i);
      if (methodMatch && blockStack.length && blockStack.includes('class')) {
        // if a previous method block is still open, close it before starting a new one
        while (blockStack.length && blockStack[blockStack.length - 1] === 'method') {
          const closed = popBlock();
          if (closed === 'event') output += '});\n'; else output += '}\n';
        }
        const isStatic = !!methodMatch[1];
        const name = methodMatch[2];
        const params = (methodMatch[3] || '').trim();
        const prefix = isStatic ? 'static ' : '';
        output += `${prefix}${name}(${params}) {\n`;
        pushBlock('method');
        i++;
        continue;
      }

      // if a line ends with an opening brace, emit it and push a generic block
      if (line.endsWith('{')) {
        output += line + '\n';
        pushBlock('block');
        i++;
        continue;
      }

      // class declaration: 'class Name'
      const classMatch = line.match(/^class\s+(\w+)/i);
      if (classMatch) {
        const name = classMatch[1];
        // close open top-level blocks
        while (blockStack.length) {
          const closed = popBlock();
          if (closed === 'event') output += '});\n'; else output += '}\n';
        }
        output += `class ${name} {\n`;
        pushBlock('class');
        i++;
        continue;
      }

      // event handler: 'on <target> <event> (args)'
      const evtMatch = line.match(/^on\s+(\w+)\s+(\w+)(?:\s*\(([^)]*)\))?/i);
      if (evtMatch) {
        const target = evtMatch[1];
        const event = evtMatch[2];
        const args = (evtMatch[3] || '').trim();
        output += `${target}.addEventListener('${event}', (${args}) => {\n`;
        pushBlock('event');
        i++;
        continue;
      }

      // when (cond) or when cond -> if (cond) { ... }
      let whenMatch = line.match(/^when\s*(?:\((.+)\)|(.+?))\s*:??$/i);
      if (whenMatch) {
        let cond = (whenMatch[1] || whenMatch[2] || '').trim();
        // TODO: additional null-check patterns could be handled here if needed
        output += `if (${cond}) {\n`;
        pushBlock('if');
        i++;
        continue;
      }

      // else (allow optional colon)
      if (/^else\s*:??$/i.test(line)) {
        if (blockStack.length && blockStack[blockStack.length - 1] === 'if') {
          output += `} else {\n`;
          popBlock();
        } else {
          output += `else {\n`;
        }
        pushBlock('else');
        i++;
        continue;
      }

      // loop (cond) or loop cond -> while (cond) {
      let loopMatch = line.match(/^loop\s*(?:\((.+)\)|(.+?))\s*:??$/i);
      if (loopMatch) {
        let cond = (loopMatch[1] || loopMatch[2] || '').trim();
        cond = cond.replace(/\bis\s+null\b/i, '== null');
        cond = cond.replace(/\beq\s+null\b/i, '== null');
        output += `while (${cond}) {\n`;
        pushBlock('loop');
        i++;
        continue;
      }

      // variable declaration: var or varibal
      const varMatch = line.match(/^(?:var|varibal)\s+(\w+)(?:\s*=\s*(.+))?/i);
      if (varMatch) {
        const name = varMatch[1];
        const val = varMatch[2] ? varMatch[2].trim() : null;
        output += val ? `let ${name} = ${val};\n` : `let ${name};\n`;
        i++;
        continue;
      }

      // log/print (handle before generic call) – allow `log x` or `log(x)`
      // capture anything after the keyword, including a single char
      const logMatch = line.match(/^(?:log|print)\s*(?:\((.+)\)|(.+))\s*;?$/i);
      if (logMatch) {
        const msg = logMatch[1] ? logMatch[1].trim() : logMatch[2].trim();
        output += `console.log(${msg});\n`;
        i++;
        continue;
      }

      // function call: 'call name()' or 'name()' or simply 'name' for python-style
      let callMatch = line.match(/^(?:call\s+)?(\w+)\s*\((.*)\)\s*;?$/i);
      if (callMatch) {
        const name = callMatch[1];
        const args = callMatch[2] || '';
        output += `${name}(${args});\n`;
        i++;
        continue;
      }
      // bare word call
      const bareMatch = line.match(/^[a-zA-Z_]\w*$/);
      if (bareMatch) {
        output += `${line}();\n`;
        i++;
        continue;
      }

      // return
      const returnMatch = line.match(/^return\s+(.+)$/i);
      if (returnMatch) {
        output += `return ${returnMatch[1].trim()};\n`;
        i++;
        continue;
      }

      // assignment or expression
      if (!line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}')) line += ';';
      output += line + '\n';
      i++;
    }

    // close any remaining blocks
    while (blockStack.length) {
      const b = popBlock();
      output += '}\n';
    }

    const outputPath = inputPath.replace('.seng', '.js');
    fs.writeFileSync(outputPath, output);

    console.log(`✓ Seng compilation successful: ${outputPath}`);
    return output;
  } catch (err) {
    console.error(`✗ Seng compilation error: ${err.message}`);
    throw err;
  }
}

module.exports = compileSeng;

if (require.main === module) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node compiler.js <input.seng>');
    process.exit(1);
  }
  compileSeng(path.resolve(inputPath));
}
