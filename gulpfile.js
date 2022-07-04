/**
 * Copyright 2019 Red Hat, Inc. and others.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 const gulp = require('gulp');
 const rename = require('gulp-rename');
 const cp = require('child_process');
 
 const jbangEclipseCore = 'dev.jbang.eclipse.core';
 const jbangEclipseLS = 'dev.jbang.eclipse.ls';
 const jbangEclipseDir = '../jbang-eclipse/';
 
 gulp.task('buildExtension', (done) => {
   cp.execSync(mvnw() + ' -B clean verify -DskipTests', { cwd: jbangEclipseDir, stdio: 'inherit' });
   move(jbangEclipseCore);
   move(jbangEclipseLS);
   done();
 });

 function move(baseName) {
    gulp.src(jbangEclipseDir + '/' + baseName + '/target/' + baseName + '-!(*sources).jar')
    .pipe(rename(baseName + '.jar'))
    .pipe(gulp.dest('./jars')); 
 }
 

 function mvnw() {
     return isWin() ? 'mvnw.cmd' : './mvnw';
 }
 
 function isWin() {
     return /^win/.test(process.platform);
 }