const fs = require('fs');

function promisify(func) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      func(...args, (err, data) => {
        err ? reject(err) : resolve(data);
      });
    });
  };
}
function checkObject(obj) {
  if (Array.isArray(obj)) return obj.map(checkObject);
  if (!obj || typeof obj !== 'object') return obj;
  const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  const FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
  const FN_ARG_SPLIT = /\s*,\s*/;
  return Object.keys(obj).reduce((res, key) => {
    const value = obj[key];
    if (typeof value === 'function') {
      const sval = value.toString().replace(STRIP_COMMENTS, '');
      const m = sval.match(FN_ARGS);
      const args = m[1].split(FN_ARG_SPLIT).filter(function (a) {return a;});
      res[key + '(' + args.join(',') + ')'] = sval.replace(/^function[^{]*\{|\}$/g, '');
    } else {
      res[key] = checkObject(value);
    }
    return res;
  }, {});
}

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const filename = process.argv[2];
if (!/\.js$/.test(filename)) {
  console.log('Unsupported file type:', filename);
  process.exit(1);
} else {
  readFile(process.argv[2], 'utf8')
  .then(js => (0, eval)(js))
  .then(checkObject)
  .then(obj => writeFile(filename.slice(0, -3) + '.json', JSON.stringify(obj), 'utf8'))
  .catch(err => console.error(err));
}
