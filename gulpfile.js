const fs = require('fs');
const gulp = require('gulp');
const uglify = require('gulp-uglify');
const eslint = require('gulp-eslint');
const pkg = require('./package.json');
const manifest = require('./src/manifest.json');

gulp.task('copy', () => (
  gulp.src([
    // 'src/_locales/**',
    'src/images/**',
    'src/**/*.html',
  ], {base: 'src'})
  .pipe(gulp.dest('dist'))
));

gulp.task('manifest', () => new Promise((resolve, reject) => {
  fs.writeFile('dist/manifest.json', JSON.stringify(Object.assign({}, manifest, {
    version: pkg.version,
    page_action: Object.assign({}, manifest.page_action, {default_title: manifest.name}),
  })), err => err ? reject(err) : resolve());
}));

gulp.task('js', () => {
  const stream = gulp.src('src/**/*.js')
  .pipe(uglify().on('error', e => {
    console.log(e);
  }))
  .pipe(gulp.dest('dist'));
  return stream;
});

gulp.task('eslint', () => {
  return gulp.src('src/**/*.js')
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
});

gulp.task('default', ['copy', 'js', 'manifest']);
