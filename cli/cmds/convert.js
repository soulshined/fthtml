"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const ftHTML = require("../../lib/index");
const error_1 = require("../utils/error");
const _ = require("../utils/frequent");
const user_config_1 = require("../utils/user-config");
const glob = require("glob");
const js_beautify_1 = require("js-beautify");
const user_config_helper_1 = require("../utils/user-config-helper");
const html_builder_1 = require("../../lib/model/html-builder");
let root;
let uconfig;
async function default_1(args) {
    var _a, _b, _c;
    uconfig = (await user_config_1.default).configs;
    if (args.c) {
        let filepath = args.c;
        if (!path.isAbsolute(filepath)) {
            filepath = path.resolve(args.c);
        }
        try {
            const argConfig = await user_config_helper_1.default(filepath);
            if (argConfig.fileExists)
                user_config_helper_1.merge(uconfig, argConfig.configs);
        }
        catch (err) {
            error_1.default(err, true);
        }
    }
    uconfig.isdebug = uconfig.isdebug || args.debug;
    let dest = (_a = uconfig.exportDir, (_a !== null && _a !== void 0 ? _a : (_b = args.d, (_b !== null && _b !== void 0 ? _b : ''))));
    if (uconfig.isdebug)
        console.log("fthtmlconfig =>", uconfig);
    try {
        root = (_c = uconfig.rootDir, (_c !== null && _c !== void 0 ? _c : path.resolve(args._[1] || './')));
        if (!uconfig.exportDir && args.d) {
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
    fs.readFile(file, 'utf8', async (err, content) => {
        if (err)
            throw error_1.default(err.message, true);
        const pp = path.parse(file);
        let html = '';
        try {
            html = await ftHTML.renderFile(path.resolve(pp.dir, pp.name));
        }
        catch (err) {
            error_1.default(err, true);
        }
        if (args.t) {
            console.log(`Writing to '${path.resolve(dest, path.basename(file, '.fthtml') + '.html')}'\n\t${html.substring(html_builder_1.HTMLBuilder.getDisclaimer().length)}`);
        }
        else {
            writeFile(dest, `${path.basename(file, '.fthtml')}.html`, args.p == true ? beautify(html) : html);
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
        files.forEach(async (file) => {
            const pp = path.parse(file);
            let html = '';
            try {
                html = await ftHTML.renderFile(path.resolve(pp.dir, pp.name));
            }
            catch (err) {
                error_1.default(err, true);
            }
            if (args.t) {
                console.log(`\nWriting to '${path.resolve(getDestination(file, dest, args), path.basename(file, '.fthtml') + '.html')}'\n\t${html.substring(html_builder_1.HTMLBuilder.getDisclaimer().length)}`);
            }
            else {
                writeFile(getDestination(file, dest, args), `${path.basename(file, '.fthtml')}.html`, args.p == true || uconfig.prettify ? beautify(html) : html);
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
    let _path = path.resolve(dest === '' ? path.dirname(dir) : dest, ((uconfig.keepTreeStructure || args.k) && path.dirname(dir).startsWith(root) && path.dirname(dir) != root) ? path.relative(root, path.dirname(dir)) : '');
    return _path;
}
function getExcludedPaths(args) {
    let excluded = ['**/test/**', '**/node_modules/**', '**/.fthtml/imports/**', ...uconfig.excluded];
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
function beautify(html) {
    return js_beautify_1.html_beautify(html, {
        indent_char: " ",
        indent_scripts: "normal",
        indent_size: 4,
        indent_with_tabs: false,
        preserve_newlines: true
    });
}
//# sourceMappingURL=convert.js.map