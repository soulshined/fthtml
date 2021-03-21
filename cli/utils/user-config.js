"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("./frequent");
const path = require("path");
const macros_1 = require("../../lib/lexer/grammar/macros");
const functions_1 = require("../../lib/lexer/grammar/functions");
const models_1 = require("../../lib/parser/models");
const fthtmlconfig = path.resolve(process.cwd(), 'fthtmlconfig.json');
const config = {
    rootDir: null,
    keepTreeStructure: false,
    extends: [],
    excluded: [],
    importDir: null,
    exportDir: null,
    jsonDir: null,
    prettify: false,
    globalvars: {},
    tinytemplates: {}
};
function setGlobalVars(json) {
    Object.keys(json['globalvars']).forEach(gvar => {
        if (macros_1.default[gvar] !== undefined || functions_1.default[gvar] !== undefined || !_.isTypeOf(json['globalvars'][gvar], 'string'))
            return;
        config.globalvars[gvar] = json['globalvars'][gvar];
    });
}
function setGlobalTinyTemplates(json, origin) {
    Object.keys(json['tinytemplates']).forEach(val => {
        if (macros_1.default[val] !== undefined || functions_1.default[val] !== undefined || !_.isTypeOf(json['tinytemplates'][val], 'string'))
            return;
        config.tinytemplates[val] = models_1.TinyTemplate({
            type: 'String',
            value: json['tinytemplates'][val]
        }, null, null, origin);
    });
}
let file = _.getJSONFromFile(fthtmlconfig);
if (file !== null) {
    const { json: parsed, content } = file;
    if (parsed['extend']) {
        const exts = parsed.extend;
        for (const ext of exts) {
            if (!_.isTypeOf(ext, 'string') || ext.startsWith("http"))
                continue;
            const location = path.isAbsolute(ext) ? ext : path.resolve(ext);
            const file = _.getJSONFromFile(location, ext, content, fthtmlconfig);
            if (file === null)
                continue;
            const { json } = file;
            config.extends.push(location);
            if (json['globalvars'])
                setGlobalVars(json);
            if (json['tinytemplates'])
                setGlobalTinyTemplates(json, location);
            if (json['excluded'])
                config.excluded.push(...json.excluded);
            if (json['importDir'])
                config.importDir = path.resolve(json.importDir);
            if (json['exportDir'])
                config.exportDir = path.resolve(json.exportDir);
            if (json['jsonDir'])
                config.jsonDir = path.resolve(json.jsonDir);
        }
    }
    if (_.isTypeOfAndNotEmpty(parsed.rootDir, 'string'))
        config.rootDir = path.resolve(parsed.rootDir);
    if (_.isTypeOf(parsed.keepTreeStructure, 'boolean'))
        config.keepTreeStructure = parsed.keepTreeStructure;
    if (_.isTypeOf(parsed.prettify, 'boolean'))
        config.prettify = parsed.prettify;
    if (Array.isArray(parsed.excluded)) {
        if (_.isTypesOfAndNotEmpty(parsed.excluded, 'string'))
            config.excluded.push(...parsed.excluded);
    }
    if (_.isTypeOfAndNotEmpty(parsed.importDir, 'string'))
        config.importDir = path.resolve(parsed.importDir);
    if (_.isTypeOfAndNotEmpty(parsed.jsonDir, 'string'))
        config.jsonDir = path.resolve(parsed.jsonDir);
    if (_.isTypeOfAndNotEmpty(parsed.exportDir, 'string'))
        config.exportDir = path.resolve(parsed.exportDir);
    if (_.isTypeOf(parsed.globalvars, 'object'))
        setGlobalVars(parsed);
    if (_.isTypeOf(parsed.tinytemplates, 'object'))
        setGlobalTinyTemplates(parsed, fthtmlconfig);
}
config.excluded = Array.from(new Set(config.excluded));
exports.default = config;
