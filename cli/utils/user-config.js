"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("./frequent");
const path = require("path");
const macros_1 = require("../../lib/lexer/grammar/macros");
const fthtmlconfig = path.resolve(process.cwd(), 'fthtmlconfig.json');
const config = {
    rootDir: null,
    keepTreeStructure: false,
    excluded: [],
    importDir: null,
    exportDir: null,
    jsonDir: null,
    prettify: false,
    globalvars: {}
};
if (_.fileExists(fthtmlconfig)) {
    const parsed = _.getJSONFromFile(fthtmlconfig);
    if (_.isTypeOfAndNotEmpty(parsed.rootDir, 'string'))
        config.rootDir = path.resolve(parsed.rootDir);
    if (_.isTypeOf(parsed.keepTreeStructure, 'boolean'))
        config.keepTreeStructure = parsed.keepTreeStructure;
    if (_.isTypeOf(parsed.prettify, 'boolean'))
        config.prettify = parsed.prettify;
    if (Array.isArray(parsed.excluded)) {
        if (_.isTypesOfAndNotEmpty(parsed.excluded, 'string'))
            config.excluded = parsed.excluded;
    }
    if (_.isTypeOfAndNotEmpty(parsed.importDir, 'string'))
        config.importDir = path.resolve(parsed.importDir);
    if (_.isTypeOfAndNotEmpty(parsed.jsonDir, 'string'))
        config.jsonDir = path.resolve(parsed.jsonDir);
    if (_.isTypeOfAndNotEmpty(parsed.exportDir, 'string'))
        config.exportDir = path.resolve(parsed.exportDir);
    if (_.isTypeOf(parsed.globalvars, 'object')) {
        if (_.isTypesOfAndNotEmpty(parsed.globalvars, 'string'))
            config.globalvars = parsed.globalvars;
        Object.keys(config.globalvars).forEach(gvar => {
            if (macros_1.default[gvar] !== undefined)
                delete config.globalvars[gvar];
        });
    }
}
exports.default = config;
