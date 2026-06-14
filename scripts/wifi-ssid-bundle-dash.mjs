#!/usr/bin/env node
/** Concat qrcode vendor + dash source → desktop.js for kintone deploy */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'customize', 'wifi-ssid-dash');
const vendor = readFileSync(path.join(dir, 'qrcode-vendor.js'), 'utf8');
const src = readFileSync(path.join(dir, 'desktop.src.js'), 'utf8');
writeFileSync(path.join(dir, 'desktop.js'), `${vendor}\n${src}`, 'utf8');
console.log('bundled customize/wifi-ssid-dash/desktop.js');
