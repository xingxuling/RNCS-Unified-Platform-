import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createURRFV03CoverageMatrix} from '../src/index.mjs';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.resolve(packageRoot, '..', '..', '..', 'docs', 'verification', 'URRF_V03_COVERAGE_MATRIX');
const outputPath = path.join(outputDirectory, 'urrf-v03-coverage-matrix.json');
const matrix = createURRFV03CoverageMatrix();

fs.mkdirSync(outputDirectory, {recursive: true});
fs.writeFileSync(outputPath, `${JSON.stringify(matrix, null, 2)}\n`, 'utf8');
console.log(`wrote ${outputPath}`);
