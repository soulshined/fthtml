const fs = require('fs');

function fileExists(file) {
    try {
        return fs.existsSync(file);
    } catch (err) {
    }
}

function getJSONFromFile(file) {
    if (fileExists(file))
        return JSON.parse(fs.readFileSync(file));
    else
        return null;
}

function isTypeOf(aObject, expecting) {
    return typeof aObject === expecting;
}
function isTypeOfAndNotEmpty(aObject, expecting) {
    return isTypeOf(aObject, expecting) && aObject.length > 0;
}
function isTypesOfAndNotEmpty(aObject, expecting) {
    return aObject.every(e => isTypeOfAndNotEmpty(e, expecting) && e.length > 0);
}

module.exports = {
    fileExists,
    getJSONFromFile,
    isTypeOf,
    isTypeOfAndNotEmpty,
    isTypesOfAndNotEmpty
}