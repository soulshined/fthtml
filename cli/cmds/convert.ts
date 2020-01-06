import * as fs from "fs";
import * as path from 'path';
import * as ftHTML from "../../lib/index";
import { default as error } from "../utils/error";
import * as _ from "../utils/frequent";
import { default as uconfig } from "../utils/user-config";
import * as glob from "glob";

let root: string;

export default function (args) {
    let dest = uconfig.exportDir ?? (args.d ?? '');

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
    fs.readFile(file, 'utf8', (err, content) => {
        if (err) throw error(err.message, true);
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
    })
}

function convertFiles(dir, dest, args) {

    glob("**/*.fthtml", {
        cwd: dir, nosort: true, ignore: getExcludedPaths(args), realpath: true
    }, (err, files) => {
        if (err) error(err, true);

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
    let excluded = ['**/test/**', '.vscode', '.git', ...uconfig.excluded];

    if (args.e) {
        if (Array.isArray(args.e)) excluded.push(...args.e)
        else
            if (typeof args.e === 'string') excluded.push(args.e)
        if (args['--'].length > 0) excluded.push(...args['--']);
    }

    return excluded;
}

//this pretty print func isn't perfect, but its a solid solution as opposed to using an entire library/module for this one task
//taken from stackoverflow but lost the link because it was in a comment :( thank you creator...whoever you are!
// this does have some downsides when it comes to elements that preserve whitespace (pre, code)
function prettyPrint(code: string, stripWhiteSpaces: boolean = true, stripEmptyLines = true) {
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