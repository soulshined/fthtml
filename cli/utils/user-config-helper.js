"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("./frequent");
const path = require("path");
const grammar_1 = require("../../lib/lexer/grammar");
const fthtmlelement_1 = require("../../lib/model/fthtmlelement");
const token_1 = require("../../lib/model/token");
exports.defaults = {
    rootDir: null,
    keepTreeStructure: false,
    extends: [],
    excluded: [],
    importDir: null,
    exportDir: null,
    jsonDir: null,
    prettify: false,
    isdebug: false,
    globalvars: {},
    tinytemplates: {}
};
function isKeyword(word) {
    return word === 'this' ||
        grammar_1.default.macros[word] !== undefined ||
        grammar_1.default.functions[word] !== undefined ||
        grammar_1.default.elangs[word] !== undefined ||
        grammar_1.default.keywords.indexOf(word) !== -1 ||
        grammar_1.default.pragmas.indexOf(word) !== -1 ||
        grammar_1.default.operators.indexOf(word) !== -1 ||
        grammar_1.default.stringSymbols.indexOf(word) !== -1;
}
function setGlobalVars(json, configuration) {
    Object.keys(json['globalvars']).forEach(gvar => {
        gvar = gvar.trim();
        if (isKeyword(gvar) || !_.isTypeOf(json['globalvars'][gvar], 'string'))
            return;
        configuration.globalvars[gvar] = json['globalvars'][gvar];
    });
}
function setGlobalTinyTemplates(json, origin, configuration) {
    Object.keys(json['globalTinyTemplates']).forEach(val => {
        val = val.trim();
        if (isKeyword(val) || !_.isTypeOf(json['globalTinyTemplates'][val], 'string'))
            return;
        configuration.tinytemplates[val] = fthtmlelement_1.FTHTMLElement.TinyTemplate.create(new token_1.Token("String", json['globalTinyTemplates'][val], token_1.Token.Position.create(0, 0)), origin);
    });
}
async function parseFTHTMLConfig(filepath) {
    let file = await _.getJSON(filepath);
    if (file !== null) {
        const thisconfig = Object.assign({}, exports.defaults);
        const { json: parsed, content } = file;
        if (parsed['extend']) {
            const exts = parsed.extend;
            for (const ext of exts) {
                if (!_.isTypeOf(ext, 'string'))
                    continue;
                const location = path.isAbsolute(ext)
                    ? ext
                    : ext.startsWith('http') ? ext : path.resolve(path.dirname(filepath), ext);
                const file = await _.getJSON(location, ext, content, filepath);
                if (file === null)
                    continue;
                const { json } = file;
                thisconfig.extends.push(location);
                if (json['globalvars'])
                    setGlobalVars(json, thisconfig);
                if (json['globalTinyTemplates'])
                    setGlobalTinyTemplates(json, location, thisconfig);
                if (json['excluded'])
                    thisconfig.excluded.push(...json.excluded);
                if (json['importDir'])
                    thisconfig.importDir = path.resolve(json.importDir);
                if (json['exportDir'])
                    thisconfig.exportDir = path.resolve(json.exportDir);
                if (json['jsonDir'])
                    thisconfig.jsonDir = path.resolve(json.jsonDir);
            }
        }
        if (_.isTypeOfAndNotEmpty(parsed.rootDir, 'string'))
            thisconfig.rootDir = path.resolve(parsed.rootDir);
        if (_.isTypeOf(parsed.keepTreeStructure, 'boolean'))
            thisconfig.keepTreeStructure = parsed.keepTreeStructure;
        if (_.isTypeOf(parsed.prettify, 'boolean'))
            thisconfig.prettify = parsed.prettify;
        if (Array.isArray(parsed.excluded)) {
            if (_.isTypesOfAndNotEmpty(parsed.excluded, 'string'))
                thisconfig.excluded.push(...parsed.excluded);
        }
        if (_.isTypeOfAndNotEmpty(parsed.importDir, 'string'))
            thisconfig.importDir = path.resolve(parsed.importDir);
        if (_.isTypeOfAndNotEmpty(parsed.jsonDir, 'string'))
            thisconfig.jsonDir = path.resolve(parsed.jsonDir);
        if (_.isTypeOfAndNotEmpty(parsed.exportDir, 'string'))
            thisconfig.exportDir = path.resolve(parsed.exportDir);
        if (_.isTypeOf(parsed.globalvars, 'object'))
            setGlobalVars(parsed, thisconfig);
        if (_.isTypeOf(parsed.globalTinyTemplates, 'object'))
            setGlobalTinyTemplates(parsed, filepath, thisconfig);
        if (_.isTypeOf(parsed.debug, 'boolean'))
            thisconfig.isdebug = parsed.debug;
        thisconfig.excluded = Array.from(new Set(thisconfig.excluded));
        return {
            configs: thisconfig,
            fileExists: true
        };
    }
    return Promise.resolve({
        configs: exports.defaults,
        fileExists: false
    });
}
exports.parseFTHTMLConfig = parseFTHTMLConfig;
function merge(config, fromConfig) {
    config.isdebug = fromConfig.isdebug;
    config.excluded = fromConfig.excluded;
    config.exportDir = fromConfig.exportDir;
    config.extends = fromConfig.extends;
    config.globalvars = fromConfig.globalvars;
    config.importDir = fromConfig.importDir;
    config.jsonDir = fromConfig.jsonDir;
    config.keepTreeStructure = fromConfig.keepTreeStructure;
    config.prettify = fromConfig.prettify;
    config.rootDir = fromConfig.rootDir;
    config.tinytemplates = fromConfig.tinytemplates;
}
exports.merge = merge;
exports.default = parseFTHTMLConfig;
//# sourceMappingURL=user-config-helper.js.map