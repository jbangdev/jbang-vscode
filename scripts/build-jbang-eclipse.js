const { exec } = require('shelljs');
const path = require('path');
const fs = require('fs');
const { platform } = require('os');
const { globSync } = require('glob');

const jbangEclipseCore = 'dev.jbang.eclipse.core';
const jbangEclipseLS = 'dev.jbang.eclipse.ls';
const workDir = process.cwd();
const jbangEclipseDir = path.join(workDir, '..', 'jbang-eclipse');
function copy(baseName) {
  const sourcePattern = path.join(jbangEclipseDir, baseName, 'target', `${baseName}-!(*sources).jar`);
  const destPath = path.join(workDir, 'jars', `${baseName}.jar`);

  const files = globSync(sourcePattern);
  if (files.length === 0) {
    throw new Error(`Failed to find files matching ${sourcePattern}`);
  }
  const sourcePath = files[0];
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)){
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Copied ${sourcePath} to ${destPath}`);
}

function mvnw() {
  return platform() === 'win32' ? 'mvnw.cmd' : './mvnw';
}

exec(`${mvnw()} clean verify -DskipTests`, { cwd: jbangEclipseDir, stdio: 'inherit' });
copy(jbangEclipseCore);
copy(jbangEclipseLS);
