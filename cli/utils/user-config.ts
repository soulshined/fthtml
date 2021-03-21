import * as _ from "./frequent";
import * as path from "path";
import { default as macros } from "../../lib/lexer/grammar/macros";
import functions from "../../lib/lexer/grammar/functions";
import { TinyTemplate } from "../../lib/parser/models";

const fthtmlconfig = path.resolve(process.cwd(), 'fthtmlconfig.json');

const config = {
    rootDir: <string>null,
    keepTreeStructure: <boolean>false,
    extends: <string[]>[],
    excluded: <string[]>[],
    importDir: <string>null,
    exportDir: <string>null,
    jsonDir: <string>null,
    prettify: <boolean>false,
    globalvars: {},
    tinytemplates: {}
}

function setGlobalVars(json) {
    Object.keys(json['globalvars']).forEach(gvar => {
        if (macros[gvar] !== undefined || functions[gvar] !== undefined || !_.isTypeOf(json['globalvars'][gvar], 'string'))
            return;

        config.globalvars[gvar] = json['globalvars'][gvar];
    })
}

function setGlobalTinyTemplates(json, origin) {
    Object.keys(json['tinytemplates']).forEach(val => {
        if (macros[val] !== undefined || functions[val] !== undefined || !_.isTypeOf(json['tinytemplates'][val], 'string'))
            return;

        config.tinytemplates[val] = TinyTemplate({
                // @ts-ignore
                type: 'String',
                value: json['tinytemplates'][val]
            }, null, null, origin)
    })
}

let file = _.getJSONFromFile(fthtmlconfig);
if (file !== null) {
    const { json: parsed, content } = file;

    //extends
    if (parsed['extend']) {
        const exts = parsed.extend;
        for (const ext of exts) {
            if (!_.isTypeOf(ext, 'string') || ext.startsWith("http"))
                continue;

            const location = path.isAbsolute(ext) ? ext : path.resolve(ext);
            const file = _.getJSONFromFile(location, ext, content, fthtmlconfig);
            if (file === null) continue;
            const { json } = file;
            config.extends.push(location);

            if (json['globalvars']) setGlobalVars(json);
            if (json['tinytemplates']) setGlobalTinyTemplates(json, location);
            if (json['excluded']) config.excluded.push(...json.excluded);
            if (json['importDir']) config.importDir = path.resolve(json.importDir);
            if (json['exportDir']) config.exportDir = path.resolve(json.exportDir);
            if (json['jsonDir']) config.jsonDir = path.resolve(json.jsonDir);
        }
    }

    //rootDir
    if (_.isTypeOfAndNotEmpty(parsed.rootDir, 'string'))
        config.rootDir = path.resolve(parsed.rootDir);

    //keepTreeStructure
    if (_.isTypeOf(parsed.keepTreeStructure, 'boolean'))
        config.keepTreeStructure = parsed.keepTreeStructure;

    //prettify
    if (_.isTypeOf(parsed.prettify, 'boolean'))
        config.prettify = parsed.prettify;

    //excluded
    if (Array.isArray(parsed.excluded)) {
        if (_.isTypesOfAndNotEmpty(parsed.excluded, 'string'))
            config.excluded.push(...parsed.excluded);
    }

    //importDir
    if (_.isTypeOfAndNotEmpty(parsed.importDir, 'string'))
        config.importDir = path.resolve(parsed.importDir);

    //jsonDir
    if (_.isTypeOfAndNotEmpty(parsed.jsonDir, 'string'))
        config.jsonDir = path.resolve(parsed.jsonDir);

    //exportDir
    if (_.isTypeOfAndNotEmpty(parsed.exportDir, 'string'))
        config.exportDir = path.resolve(parsed.exportDir);

    //global vars
    if (_.isTypeOf(parsed.globalvars, 'object'))
        setGlobalVars(parsed);

    //global tinytemplates
    if (_.isTypeOf(parsed.tinytemplates, 'object'))
        setGlobalTinyTemplates(parsed, fthtmlconfig);
}

config.excluded = Array.from(new Set(config.excluded));
export default config;