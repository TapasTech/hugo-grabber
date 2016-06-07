const gulp = require('gulp');
const replace = require('gulp-replace');
const pkg = require('./package.json');
const isProd = process.env.NODE_ENV === 'production';

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
    ISPROD: isProd,
  };
  return gulp.src('src/*.js')
  .pipe(replace(/\bwindow\.CONST_(\w+)\b/g, (match, name) => JSON.stringify(CONSTS[name] || null)))
  .pipe(gulp.dest('dist'));
});

gulp.task('default', ['copy', 'js', 'manifest']);
