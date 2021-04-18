"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const exceptions_1 = require("../../lib/utils/exceptions");
function fileExists(file) {
    try {
        return fs.existsSync(file);
    }
    catch (err) {
        return false;
    }
}
exports.fileExists = fileExists;
function getJSONFromFile(file, extendLocation, inContent, parent) {
    if (!fileExists(file) || !file.endsWith('.json')) {
        if (extendLocation) {
            let isInExtend = false;
            let line = 0;
            let col = 0;
            const lines = inContent.split("\n");
            for (let i = 0; i < lines.length; ++i) {
                if (isInExtend) {
                    if (lines[i].trim() === `"${extendLocation}"`) {
                        line = i;
                        col = lines[i].indexOf(`"${extendLocation}"`);
                        break;
                    }
                }
                else if (lines[i].trim().startsWith('"extend"')) {
                    isInExtend = true;
                }
            }
            throw new exceptions_1.ftHTMLImportError(`JSON file '${file}' doesn't exist or isn't compatible`, {
                type: "Keyword",
                value: 'extend',
                position: {
                    line: line + 1,
                    column: col + 1
                }
            }, parent);
        }
        return null;
    }
    try {
        const content = fs.readFileSync(file, 'utf8');
        return {
            origin: file,
            content,
            json: JSON.parse(content)
        };
    }
    catch (error) {
        return null;
    }
}
exports.getJSONFromFile = getJSONFromFile;
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