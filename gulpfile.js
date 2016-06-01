const gulp = require('gulp');
const replace = require('gulp-replace');

gulp.task('copy', () => (
  gulp.src([
    'src/images/**',
    'src/manifest.json',
  ], {base: 'src'})
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

gulp.task('default', ['copy', 'js']);
