const fs = require('fs');
const gulp = require('gulp');
const replace = require('gulp-replace');
const pkg = require('./package.json');
const isProd = process.env.NODE_ENV === 'production';

gulp.task('copy', () => (
  gulp.src([
    'src/_locales/**',
    'src/images/**',
  ], {base: 'src'})
  .pipe(gulp.dest('dist'))
));

gulp.task('manifest', () => {
  return new Promise((resolve, reject) => fs.readFile('src/manifest.json', 'utf8', (err, data) => {
    err ? reject(err) : resolve(data);
  }))
  .then(text => JSON.parse(text))
  .then(data => {
    data.version = pkg.version;
    data.page_action.default_title = data.name;
    return new Promise((resolve, reject) => {
      fs.writeFile('dist/manifest.json', JSON.stringify(data), err => {
        err ? reject(err) : resolve();
      });
    });
  });
});

gulp.task('js', () => {
  const CONSTS = {
    ISPROD: isProd,
  };
  return gulp.src('src/*.js')
  .pipe(replace(/\bwindow\.CONST_(\w+)\b/g, (match, name) => JSON.stringify(CONSTS[name] || null)))
  .pipe(gulp.dest('dist'));
});

gulp.task('default', ['copy', 'js', 'manifest']);
