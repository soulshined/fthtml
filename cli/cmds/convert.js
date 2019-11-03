(function () {
  const ndir = require('node-dir');
  const fs = require('fs');
  const path = require('path');
  const fthtml = require('../../index');
  const Spinner = require('cli-spinner').Spinner;
  const error = require('../utils/error');
  const config = require('../utils/user-config')();

  let root;
  let spinner = new Spinner('%s Converting...\n');

  module.exports = (args) => {
    let dest = config.exportDir ? config.exportDir : args.d || '';

    try {
      root = config.rootDir ? config.rootDir : path.resolve(args._[1] || './');

      if (!config.exportDir && args.d) {
        dest = path.resolve(dest);
        fs.lstatSync(dest).isDirectory();
      }
      spinner.start();

      if (fs.lstatSync(root).isDirectory()) convertFiles(root, dest, args);
      else if (fs.lstatSync(root).isFile()) convertFile(root, getDestination(root, dest, args), args);
      else error(`Can not convert '${root}'`);
    }
    catch (err) {
      error(err.message, true);
    }

  }
  function convertFile(file, dest, args) {
    console.time('Duration');
    fs.readFile(file, 'utf8', (err, content) => {
      if (err) throw error(err.message, true);
      const pp = path.parse(file);
      const html = fthtml.renderFile(path.resolve(pp.dir, pp.name));
      if (args.t) {
        console.log(`Writing to '${path.resolve(dest, path.basename(file, '.fthtml') + '.html')}'\n\t${html}`);
      }
      else {
        writeFile(dest, `${path.basename(file, '.fthtml')}.html`, args.p == true ? prettyPrint(html) : html);
      }
      spinner.stop(true);
      console.log(`\nDone. Converted ${file} => ${dest}`);
      console.timeEnd('Duration');
    })
  }
  function convertFiles(dir, dest, args) {
    console.time('Duration');
    ndir.readFiles(dir, {
      match: /.fthtml$/,
      excludeDir: getExcludedPaths(args)
    },
      (err, content, filename, next) => {
        if (err) error(err, true);
        const pp = path.parse(filename);
        const html = fthtml.renderFile(path.resolve(pp.dir, pp.name));
        if (args.t) {
          console.log(`\nWriting to '${path.resolve(getDestination(filename, dest, args), path.basename(filename, '.fthtml') + '.html')}'\n\t${html}`);
        }
        else {
          writeFile(getDestination(filename, dest, args), `${path.basename(filename, '.fthtml')}.html`, args.p == true ? prettyPrint(html) : html);
        }
        next();
      },
      (err, files) => {
        if (err) error(err, true);
        spinner.stop(true);
        console.log(`\nDone. Converted ${files.length} ftHTML files => ${dest == '' ? dir : dest}`);
        console.timeEnd('Duration');
      });
  }
  function writeFile(dir, filename, content) {
    validateDir(dir, (err) => {
      if (err) error(err, true);
      fs.writeFile(path.resolve(dir, filename), content, 'utf8',
        (fserror) => {
          if (fserror) error(fserror.message, true);
        });
    })
  }
  function validateDir(dir, callback) {
    fs.stat(dir, (err, stats) => {
      if (err && err.code === 'ENOENT') fs.mkdir(dir, callback);
      else if (err) callback(err);
      else callback();
    });
  }
  function getDestination(dir, dest, args) {
    let _path = path.resolve(
      dest === '' ? path.dirname(dir) : dest, ((config.keepTreeStructure || args.k) && path.dirname(dir).startsWith(root) && path.dirname(dir) != root) ? path.relative(root, path.dirname(dir)) : '');
    return _path;
  }
  function getExcludedPaths(args) {
    let excluded = ['node_modules', 'test', ...config.excluded];

    if (args.e) {
      if (Array.isArray(args.e)) excluded.push(...args.e)
      else
        if (typeof args.e === 'string') excluded.push(args.e)
      if (args['--'].length > 0) excluded.push(...args['--']);
    }

    console.log(excluded);
    return excluded;
  }

  //this pretty print func isn't perfect, but its a solid solution as opposed to using an entire library/module for this one task
  //taken from stackoverflow but lost the link because it was in a comment :( thank you creator...whoever you are!
  // this does have some downsides when it comes to elements that preserve whitespace (pre, code)
  function prettyPrint(code, stripWhiteSpaces = true, stripEmptyLines = true) {
    var whitespace = ' '.repeat(2),
      currentIndent = 0,
      char = null,
      nextChar = null,
      result = '';

    for (var pos = 0; pos <= code.length; pos++) {
      char = code.substr(pos, 1);
      nextChar = code.substr(pos + 1, 1);

      if (char === '<' && nextChar !== '/') {
        result += '\n' + whitespace.repeat(currentIndent);
        currentIndent++;
      }
      else if (char === '<' && nextChar === '/') {
        if (--currentIndent < 0) currentIndent = 0;
        result += '\n' + whitespace.repeat(currentIndent);
      }
      else if (stripWhiteSpaces === true && char === ' ' && nextChar === ' ') char = '';
      else if (stripEmptyLines === true && char === '\n') {
        if (code.substr(pos, code.substr(pos).indexOf("<")).trim() === '') char = '';
      }

      result += char;
    }

    return result;
  }
})();

