/** Simple Ceng Compiler - Direct English to CSS translation */

const fs = require('fs');
const path = require('path');

function compileCeng(inputPath) {
  try {
    const source = fs.readFileSync(inputPath, 'utf-8');
    // Support raw passthrough: a .ceng file that starts with '@raw' will be returned as-is (after the marker)
    if (source.trim().startsWith('@raw')) {
      const raw = source.split('\n').slice(1).join('\n');
      const outputPath = inputPath.replace('.ceng', '.css');
      fs.writeFileSync(outputPath, raw);
      console.log(`✓ Ceng (raw) passthrough: ${outputPath}`);
      return raw;
    }
    let output = '';

    const lines = source.split('\n');
    let inBlock = false;
    const closeBlock = () => {
      if (inBlock) {
        output += '}\n';
        inBlock = false;
      }
    };

    for (let raw of lines) {
      let line = raw.trim();

      // Skip comments and empty lines
      if (!line || line.startsWith('--')) continue;

      // explicit closing brace
      if (line === '}') {
        closeBlock();
        continue;
      }

      // allow optional 'for' and normalize selector keywords
      if (line.toLowerCase().startsWith('for ') || line.match(/^body\b/i) || line.match(/^class\b/i) || line.match(/^id\b/i) || line.match(/^[.#]/)) {
        line = line.replace(/^for\s+/i, '');
      }
      // fix common selector typos
      line = line.replace(/\bclss\b/i, 'class');
      line = line.replace(/\bclas\b/i, 'class');
      line = line.replace(/\bid\b/i, 'ID');

      // handle 'class NAME' -> .NAME and 'id NAME' -> #NAME (allow pseudo after)
      const classMatch = line.match(/^class\s+(\w+)/i);
      if (classMatch) {
        line = line.replace(/^class\s+(\w+)/i, `.${classMatch[1]}`);
      }
      const idMatch = line.match(/^id\s+(\w+)/i);
      if (idMatch) {
        line = line.replace(/^id\s+(\w+)/i, `#${idMatch[1]}`);
      }

      // when hover → :hover (works with or without braces or additional words)
      if (/\bwhen\b/i.test(line)) {
        // break on "when", keep everything before as selector, after as pseudo or state
        const parts = line.split(/\bwhen\b/i);
        let sel = parts[0].trim();
        let after = parts[1] ? parts[1].trim() : '';
        // drop any trailing '{' or comments
        after = after.replace(/\{.*$/, '').trim();
        if (after) sel = sel + ':' + after;
        line = sel;
      }

      // Translate property keywords (case-insensitive, forgiving typos)
      line = line.replace(/^background(?:-color)?\s*:\s*/i, 'background-color: ');
      line = line.replace(/^backgroun[d]?\s*:\s*/i, 'background-color: ');
      line = line.replace(/^bg\s*:\s*/i, 'background-color: ');
      line = line.replace(/^size\s*:\s*/i, 'font-size: ');
      line = line.replace(/^font[- ]?size\s*:\s*/i, 'font-size: ');
      line = line.replace(/^color\s*:\s*/i, 'color: ');
      line = line.replace(/^colou?r\s*:\s*/i, 'color: ');
      line = line.replace(/^colr\s*:\s*/i, 'color: ');
      line = line.replace(/^padding\s*:\s*/i, 'padding: ');
      line = line.replace(/^pad\s*:\s*/i, 'padding: ');
      line = line.replace(/^margin\s*:\s*/i, 'margin: ');
      line = line.replace(/^margn\s*:\s*/i, 'margin: ');
      line = line.replace(/^border\s*:\s*/i, 'border: ');
      line = line.replace(/^font\s*:\s*/i, 'font-family: ');
      line = line.replace(/^width\s*:\s*/i, 'width: ');
      line = line.replace(/^height\s*:\s*/i, 'height: ');
      line = line.replace(/^display\s*:\s*/i, 'display: ');
      line = line.replace(/^dispaly\s*:\s*/i, 'display: ');
      line = line.replace(/^flex\s*:\s*/i, 'flex-direction: ');
      line = line.replace(/^fle[tx]\s*:\s*/i, 'flex-direction: ');

      // detect selector lines – either a plain selector without a colon, or a pseudo-class selector
      const simpleSelector = /^[\.\#]?\w/.test(line) && !line.includes(':') && !line.endsWith('{') && !line.endsWith('}') && !line.endsWith(';');
      const pseudoSelector = /^[\.\#]?\w+:[\w-]+$/i.test(line);
      const isSelector = simpleSelector || pseudoSelector;
      if (isSelector) {
        if (inBlock) closeBlock();
        output += line + ' {\n';
        inBlock = true;
        continue;
      }

      // Ensure property lines end with semicolon (skip selector/open/close lines)
      if (!line.endsWith('{') && !line.endsWith('}') && !line.endsWith(';')) {
        line = line + ';';
      }

      output += line + '\n';
    }

    // close final block if left open
    closeBlock();

    const outputPath = inputPath.replace('.ceng', '.css');
    fs.writeFileSync(outputPath, output);

    console.log(`✓ Ceng compilation successful: ${outputPath}`);
    return output;
  } catch (err) {
    console.error(`✗ Ceng compilation error: ${err.message}`);
    throw err;
  }
}

module.exports = compileCeng;

if (require.main === module) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node compiler.js <input.ceng>');
    process.exit(1);
  }
  compileCeng(path.resolve(inputPath));
}
