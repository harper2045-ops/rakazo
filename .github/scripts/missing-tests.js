#!/usr/bin/env node

/**
 * Detect missing tests for changed source files in a pull request.
 * Usage: node missing-tests.js <base-sha> <head-sha>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runGit(command) {
  return execSync(command, { encoding: 'utf8' }).trim();
}

function getChangedSourceFiles(baseSha, headSha) {
  const diff = runGit(`git diff --name-only --diff-filter=ACMR ${baseSha}..${headSha}`);
  if (!diff) return [];
  
  const changed = diff.split('\n').filter(line => line.trim());
  
  const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  const testPatterns = ['.test.', '.spec.', '.d.ts'];
  
  return changed.filter(file => {
    if (testPatterns.some(pattern => file.includes(pattern))) {
      return false;
    }
    const ext = path.extname(file);
    return sourceExtensions.includes(ext);
  });
}

function findTestFile(sourceFile) {
  const dir = path.dirname(sourceFile);
  const baseName = path.basename(sourceFile, path.extname(sourceFile));
  
  const possibleTests = [
    path.join(dir, `${baseName}.test.ts`),
    path.join(dir, `${baseName}.test.tsx`),
    path.join(dir, `${baseName}.spec.ts`),
    path.join(dir, `${baseName}.spec.tsx`),
    path.join(dir, '__tests__', `${baseName}.test.ts`),
    path.join(dir, '__tests__', `${baseName}.test.tsx`),
    path.join(dir, '__tests__', `${baseName}.spec.ts`),
    path.join(dir, '__tests__', `${baseName}.spec.tsx`),
    path.join(dir, '..', '__tests__', `${baseName}.test.ts`),
    path.join(dir, 'test', `${baseName}.test.ts`),
  ];
  
  return possibleTests.find(testFile => fs.existsSync(testFile));
}

function main() {
  const baseSha = process.argv[2];
  const headSha = process.argv[3];
  
  if (!baseSha || !headSha) {
    console.error('Usage: node missing-tests.js <base-sha> <head-sha>');
    process.exit(1);
  }
  
  console.log(`Analyzing changes from ${baseSha.slice(0, 8)}..${headSha.slice(0, 8)}`);
  
  const sourceFiles = getChangedSourceFiles(baseSha, headSha);
  console.log(`Found ${sourceFiles.length} changed source files`);
  
  const missing = [];
  for (const file of sourceFiles) {
    const testFile = findTestFile(file);
    if (!testFile) {
      missing.push(file);
    }
  }
  
  if (missing.length > 0) {
    console.log('\n## Missing Tests Detected');
    console.log('The following source files were changed but have no corresponding test file:');
    missing.forEach(file => console.log(`- ${file}`));
    console.log('\nConsider adding tests for these changes.');
    
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `missing-tests-count=${missing.length}\n`);
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `missing-tests-files=${JSON.stringify(missing)}\n`);
    }
    
    console.log(`::notice title=Missing Tests::${missing.length} source files lack tests.`);
    process.exit(0);
  } else {
    console.log('✅ All changed source files have corresponding test files.');
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, 'missing-tests-count=0\n');
      fs.appendFileSync(process.env.GITHUB_OUTPUT, 'missing-tests-files=[]\n');
    }
  }
}

if (require.main === module) {
  main();
}