"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
function fileExists(file) {
    try {
        return fs.existsSync(file);
    }
    catch (err) {
        return false;
    }
}
exports.fileExists = fileExists;
function getJSONFromFile(file) {
    if (fileExists(file))
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    else
        return null;
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
    return aObject.every((e) => isTypeOfAndNotEmpty(e, expecting) && e.length > 0);
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
