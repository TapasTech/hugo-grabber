const fs = require('fs');
const gulp = require('gulp');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const pkg = require('./package.json');
const manifest = require('./src/manifest.json');

gulp.task('copy', () => (
  gulp.src([
    // 'src/_locales/**',
    'src/images/**',
    'src/**/*.html',
    'src/**/*.min.js',
  ], {base: 'src'})
  .pipe(gulp.dest('dist'))
));

// make `manifest` dependent on `copy` so that the dest directory exists
gulp.task('manifest', ['copy'], () => new Promise((resolve, reject) => {
  fs.writeFile('dist/manifest.json', JSON.stringify(Object.assign({}, manifest, {
    version: pkg.version,
    page_action: Object.assign({}, manifest.page_action, {default_title: manifest.name}),
  })), err => err ? reject(err) : resolve());
}));

gulp.task('js', () => {
  return gulp.src([
    'src/**/*.js',
    '!src/**/*.min.js',
  ])
  .pipe(uglify().on('error', e => {
    console.log(e);
  }))
  .pipe(gulp.dest('dist'));
});

gulp.task('css', () => {
  return gulp.src('src/**/*.css')
  .pipe(cssnano())
  .pipe(gulp.dest('dist'));
});

gulp.task('eslint', () => {
  return gulp.src([
    'src/**/*.js',
    '!src/**/*.min.js',
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
});

gulp.task('default', ['copy', 'js', 'css', 'manifest']);
