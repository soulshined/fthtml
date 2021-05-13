import * as fs from "fs";
import * as path from 'path';
import * as ftHTML from "../../lib/index";
import { default as error } from "../utils/error";
import * as _ from "../utils/frequent";
import configs from "../utils/user-config";
import * as glob from "glob";
import { html_beautify } from "js-beautify";
import parseFTHTMLConfig, { merge } from "../utils/user-config-helper";
import { HTMLBuilder } from "../../lib/model/html-builder";

let root: string;
let uconfig;
export default async function (args) {
    uconfig = (await configs).configs;
    if (args.c) {
        let filepath = args.c;
        if (!path.isAbsolute(filepath)) {
            filepath = path.resolve(args.c);
        }

        try {
            const argConfig = await parseFTHTMLConfig(filepath);
            if (argConfig.fileExists)
                merge(uconfig, argConfig.configs);
        } catch (err) {
            error(err, true);
        }
    }
    uconfig.isdebug = uconfig.isdebug || args.debug;
    let dest = uconfig.exportDir ?? (args.d ?? '');

    if (uconfig.isdebug)
        console.log("fthtmlconfig =>", uconfig);

    try {
        root = uconfig.rootDir ?? path.resolve(args._[1] || './');

        if (!uconfig.exportDir && args.d) {
            dest = path.resolve(dest);
            fs.lstatSync(dest).isDirectory();
        }

        if (fs.lstatSync(root).isDirectory()) convertFiles(root, dest, args);
        else if (fs.lstatSync(root).isFile()) convertFile(root, getDestination(root, dest, args), args);
        else error(`Can not convert '${root}'`);
    } catch (err) {
        error(err.message, true);
    }
}

function convertFile(file: string, dest: string, args: any) {
    _.Timer.start();
    fs.readFile(file, 'utf8', async (err, content) => {
        if (err) throw error(err.message, true);
        const pp = path.parse(file);
        let html = '';
        try {
            html = await ftHTML.renderFile(path.resolve(pp.dir, pp.name));
        }
        catch (err) {
            error(err, true);
        }

        if (args.t) {
            console.log(`Writing to '${path.resolve(dest, path.basename(file, '.fthtml') + '.html')}'\n\t${html.substring(HTMLBuilder.getDisclaimer().length)}`);
        }
        else {
            writeFile(dest, `${path.basename(file, '.fthtml')}.html`, args.p == true ? beautify(html) : html);
        }
        console.log(`\nDone. Converted ${file} => ${dest}`);
        _.Timer.end();
    })
}

function convertFiles(dir, dest, args) {

    glob("**/*.fthtml", {
        cwd: dir, nosort: true, ignore: getExcludedPaths(args), realpath: true
    }, (err, files) => {
        if (err) error(err, true);

        _.Timer.start();
        files.forEach(async file => {
            const pp = path.parse(file);
            let html = '';
            try {
                html = await ftHTML.renderFile(path.resolve(pp.dir, pp.name));
            }
            catch (err) {
                error(err, true);
            }

            if (args.t) {
                console.log(`\nWriting to '${path.resolve(getDestination(file, dest, args), path.basename(file, '.fthtml') + '.html')}'\n\t${html.substring(HTMLBuilder.getDisclaimer().length)}`);
            }
            else {
                writeFile(getDestination(file, dest, args), `${path.basename(file, '.fthtml')}.html`, args.p == true || uconfig.prettify ? beautify(html) : html);
            }
        });
        console.log(`\nDone. Converted ${files.length} ftHTML files => ${dest == '' ? dir : dest}`);
        _.Timer.end();
    })

}

function writeFile(dir: string, filename: string, content) {
    validateDir(dir, (err) => {
        if (err) error(err, true);
        fs.writeFile(path.resolve(dir, filename), content, 'utf8',
            (fserror) => {
                if (fserror) error(fserror.message, true);
            });
    })
}

function validateDir(dir: string, callback: (error?) => any) {
    fs.stat(dir, (err, stats) => {
        if (err && err.code === 'ENOENT') fs.mkdir(dir, callback);
        else if (err) callback(err);
        else callback();
    });
}

function getDestination(dir, dest, args) {
    let _path = path.resolve(
        dest === '' ? path.dirname(dir) : dest,
        ((uconfig.keepTreeStructure || args.k) && path.dirname(dir).startsWith(root) && path.dirname(dir) != root) ? path.relative(root, path.dirname(dir)) : ''
    );
    return _path;
}

function getExcludedPaths(args) {
    let excluded = ['**/test/**', '**/node_modules/**', '**/.fthtml/imports/**', ...uconfig.excluded];

    if (args.e) {
        if (Array.isArray(args.e)) excluded.push(...args.e)
        else
            if (typeof args.e === 'string') excluded.push(args.e)
        if (args['--'].length > 0) excluded.push(...args['--']);
    }

    return excluded;
}

function beautify(html: string) {
    return html_beautify(html, {
        indent_char: " ",
        indent_scripts: "normal",
        indent_size: 4,
        indent_with_tabs: false,
        preserve_newlines: true
    })
}