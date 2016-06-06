const gulp = require('gulp');
const replace = require('gulp-replace');
const pkg = require('./package.json');

gulp.task('copy', () => (
  gulp.src([
    'src/images/**',
  ], {base: 'src'})
  .pipe(gulp.dest('dist'))
));

gulp.task('manifest', () => (
  gulp.src([
    'src/manifest.json',
  ], {base: 'src'})
  .pipe(replace(/"version":\s*".*?"/, `"version": "${pkg.version}"`))
  .pipe(gulp.dest('dist'))
));

gulp.task('js', () => {
  const CONSTS = {
    URL_NEW: 'https://backend-invest.test.dtcj.com/draft/columns/_new',
  };
  return gulp.src('src/*.js')
  .pipe(replace(/\bconst CONST_(\w+) = .*?\n/g, (match, name) => (
    `const CONST_${name} = ${JSON.stringify(CONSTS[name] || null)};\n`
  )))
  .pipe(gulp.dest('dist'));
});

gulp.task('default', ['copy', 'js', 'manifest']);
