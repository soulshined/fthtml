"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const ftHTML = require("../../lib/index");
const error_1 = require("../utils/error");
const _ = require("../utils/frequent");
const user_config_1 = require("../utils/user-config");
const glob = require("glob");
let root;
function default_1(args) {
    var _a, _b, _c;
    let dest = (_a = user_config_1.default.exportDir, (_a !== null && _a !== void 0 ? _a : (_b = args.d, (_b !== null && _b !== void 0 ? _b : ''))));
    try {
        root = (_c = user_config_1.default.rootDir, (_c !== null && _c !== void 0 ? _c : path.resolve(args._[1] || './')));
        if (!user_config_1.default.exportDir && args.d) {
            dest = path.resolve(dest);
            fs.lstatSync(dest).isDirectory();
        }
        if (fs.lstatSync(root).isDirectory())
            convertFiles(root, dest, args);
        else if (fs.lstatSync(root).isFile())
            convertFile(root, getDestination(root, dest, args), args);
        else
            error_1.default(`Can not convert '${root}'`);
    }
    catch (err) {
        error_1.default(err.message, true);
    }
}
exports.default = default_1;
function convertFile(file, dest, args) {
    _.Timer.start();
    fs.readFile(file, 'utf8', (err, content) => {
        if (err)
            throw error_1.default(err.message, true);
        const pp = path.parse(file);
        const html = ftHTML.renderFile(path.resolve(pp.dir, pp.name));
        if (args.t) {
            console.log(`Writing to '${path.resolve(dest, path.basename(file, '.fthtml') + '.html')}'\n\t${html}`);
        }
        else {
            writeFile(dest, `${path.basename(file, '.fthtml')}.html`, args.p == true ? prettyPrint(html) : html);
        }
        console.log(`\nDone. Converted ${file} => ${dest}`);
        _.Timer.end();
    });
}
function convertFiles(dir, dest, args) {
    glob("**/*.fthtml", {
        cwd: dir, nosort: true, ignore: getExcludedPaths(args), realpath: true
    }, (err, files) => {
        if (err)
            error_1.default(err, true);
        _.Timer.start();
        files.forEach(file => {
            const pp = path.parse(file);
            const html = ftHTML.renderFile(path.resolve(pp.dir, pp.name));
            if (args.t) {
                console.log(`\nWriting to '${path.resolve(getDestination(file, dest, args), path.basename(file, '.fthtml') + '.html')}'\n\t${html}`);
            }
            else {
                writeFile(getDestination(file, dest, args), `${path.basename(file, '.fthtml')}.html`, args.p == true ? prettyPrint(html) : html);
            }
        });
        console.log(`\nDone. Converted ${files.length} ftHTML files => ${dest == '' ? dir : dest}`);
        _.Timer.end();
    });
}
function writeFile(dir, filename, content) {
    validateDir(dir, (err) => {
        if (err)
            error_1.default(err, true);
        fs.writeFile(path.resolve(dir, filename), content, 'utf8', (fserror) => {
            if (fserror)
                error_1.default(fserror.message, true);
        });
    });
}
function validateDir(dir, callback) {
    fs.stat(dir, (err, stats) => {
        if (err && err.code === 'ENOENT')
            fs.mkdir(dir, callback);
        else if (err)
            callback(err);
        else
            callback();
    });
}
function getDestination(dir, dest, args) {
    let _path = path.resolve(dest === '' ? path.dirname(dir) : dest, ((user_config_1.default.keepTreeStructure || args.k) && path.dirname(dir).startsWith(root) && path.dirname(dir) != root) ? path.relative(root, path.dirname(dir)) : '');
    return _path;
}
function getExcludedPaths(args) {
    let excluded = ['**/test/**', '**/node_modules/**', ...user_config_1.default.excluded];
    if (args.e) {
        if (Array.isArray(args.e))
            excluded.push(...args.e);
        else if (typeof args.e === 'string')
            excluded.push(args.e);
        if (args['--'].length > 0)
            excluded.push(...args['--']);
    }
    return excluded;
}
function prettyPrint(code, stripWhiteSpaces = true, stripEmptyLines = true) {
    var whitespace = ' '.repeat(2), currentIndent = 0, char = null, nextChar = null, result = '';
    for (var pos = 0; pos <= code.length; pos++) {
        char = code.substr(pos, 1);
        nextChar = code.substr(pos + 1, 1);
        if (char === '<' && nextChar !== '/') {
            result += '\n' + whitespace.repeat(currentIndent);
            currentIndent++;
        }
        else if (char === '<' && nextChar === '/') {
            if (--currentIndent < 0)
                currentIndent = 0;
            result += '\n' + whitespace.repeat(currentIndent);
        }
        else if (stripWhiteSpaces === true && char === ' ' && nextChar === ' ')
            char = '';
        else if (stripEmptyLines === true && char === '\n') {
            if (code.substr(pos, code.substr(pos).indexOf("<")).trim() === '')
                char = '';
        }
        result += char;
    }
    return result;
}
