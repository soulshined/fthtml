"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(message, exit) {
    console.error(message);
    exit && process.exit(1);
}
exports.default = default_1;
