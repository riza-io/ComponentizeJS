import { componentize } from '@bytecodealliance/componentize-js';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const jsSource = await readFile('app.js', 'utf8');

const { component, imports } = await componentize(jsSource, {
    worldName: 'command-extended',
    witPath: resolve('wit'),
});

await writeFile('rizajs.wasm', component);
