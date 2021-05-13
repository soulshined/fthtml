"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const fthtml_exceptions_1 = require("../../lib/model/exceptions/fthtml-exceptions");
const token_1 = require("../../lib/model/token");
function fileExists(file) {
    try {
        return fs.existsSync(file);
    }
    catch (err) {
        return false;
    }
}
exports.fileExists = fileExists;
async function getJSON(uri, extendLocation, inContent, parent) {
    const extendedLocs = [0, 0];
    if (extendLocation) {
        let isInExtend = false;
        const lines = inContent.split("\n");
        for (let i = 0; i < lines.length; ++i) {
            if (isInExtend) {
                if (lines[i].trim() === `"${extendLocation}"`) {
                    extendedLocs[0] = i;
                    extendedLocs[1] = lines[i].indexOf(`"${extendLocation}"`);
                    break;
                }
            }
            else if (lines[i].trim().startsWith('"extend"')) {
                isInExtend = true;
            }
        }
    }
    if (uri.endsWith('.json') && uri.startsWith('http')) {
        const content = await getRemoteJson(uri)
            .catch(err => {
            if (extendLocation)
                throw new fthtml_exceptions_1.FTHTMLExceptions.Import(err, new token_1.Token("Keyword", 'extend', token_1.Token.Position.create(extendedLocs[0] + 1, extendedLocs[1] + 1)), parent);
            return Promise.resolve(null);
        });
        try {
            return Promise.resolve({
                origin: uri,
                content,
                json: JSON.parse(content)
            });
        }
        catch (err) {
            return Promise.resolve(null);
        }
    }
    if (!fileExists(uri) || !uri.endsWith('.json')) {
        if (extendLocation)
            throw new fthtml_exceptions_1.FTHTMLExceptions.Import(`JSON file '${uri}' doesn't exist or isn't compatible`, new token_1.Token("Keyword", 'extend', token_1.Token.Position.create(extendedLocs[0] + 1, extendedLocs[1] + 1)), parent);
        return Promise.resolve(null);
    }
    try {
        const content = fs.readFileSync(uri, 'utf8');
        return Promise.resolve({
            origin: uri,
            content,
            json: JSON.parse(content)
        });
    }
    catch (error) {
        return Promise.resolve(null);
    }
}
exports.getJSON = getJSON;
async function getRemoteJson(url) {
    return new Promise((resolve, reject) => {
        const http = require(url.startsWith('https') ? 'https' : 'http');
        const options = {
            timeout: 10000
        };
        let data = '';
        http.get(url, options, res => {
            const { statusCode, headers: { 'content-type': contentType } } = res;
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (statusCode === 302)
                    resolve(getRemoteJson(res.headers.location));
                else if (statusCode === 200 && !/^application\/json/.test(contentType))
                    reject(`Invalid content type for extended config '${url}'`);
                else if (statusCode === 200)
                    resolve(data);
                else if (statusCode === 404)
                    reject(`Extended config '${url}' can't be found`);
                else
                    reject(`Extended config error for url '${url}'`);
            });
        }).on('error', error => reject(`Extended config error for url '${url}': ${error}`));
    });
}
function isTypeOf(aObject, expecting) {
    return typeof aObject === expecting;
}
exports.isTypeOf = isTypeOf;
function isTypeOfAndNotEmpty(aObject, expecting) {
    return isTypeOf(aObject, expecting) && aObject.length > 0;
}
exports.isTypeOfAndNotEmpty = isTypeOfAndNotEmpty;
function isTypesOfAndNotEmpty(aObject, expecting) {
    let obj = aObject;
    if (isTypeOf(aObject, 'object'))
        obj = Object.values(aObject);
    return obj.every((e) => isTypeOfAndNotEmpty(e, expecting) && e.length > 0);
}
exports.isTypesOfAndNotEmpty = isTypesOfAndNotEmpty;
let aTimer = null;
class Timer {
    static start() {
        aTimer = new Date().getTime();
    }
    static end() {
        console.log('Duration:', Math.max(new Date().getTime() - aTimer, 0), 'ms');
        aTimer = null;
    }
}
exports.Timer = Timer;
//# sourceMappingURL=frequent.js.map