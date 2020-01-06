"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getAllMatches(str, regexp) {
    let match;
    let matches = [];
    while ((match = regexp.exec(str)) !== null) {
        matches.push([...match]);
    }
    return matches;
}
exports.getAllMatches = getAllMatches;
function endsEscaped(str) {
    return !!(str.match(/[\\]*$/)[0].length % 2);
}
exports.endsEscaped = endsEscaped;
