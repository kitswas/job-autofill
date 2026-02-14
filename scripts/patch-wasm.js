const fs = require('fs');
const path = require('path');
const p = path.resolve(__dirname, '..', 'packages', 'core-wasm', 'core_wasm.js');

if (fs.existsSync(p)) {
	let s = fs.readFileSync(p, 'utf8');
	s = s.replace(/wasm\.\_\_wbindgen_start\(\);/g, "if (typeof wasm.__wbindgen_start === 'function') wasm.__wbindgen_start();");
	fs.writeFileSync(p, s);
	console.log('patched', p);
} else {
	console.log('no file to patch:', p);
}

