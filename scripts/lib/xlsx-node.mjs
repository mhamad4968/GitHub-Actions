import { createRequire } from 'node:module';

// SheetJS 0.20.x ESM does not auto-register Node fs. The official Node guide
// recommends its CommonJS build, which preserves readFile/writeFile support.
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

export default XLSX;
