import * as _ from "./frequent";
import * as path from "path";
import grammar from "../../lib/lexer/grammar";
import { FTHTMLElement } from "../../lib/model/fthtmlelement";
import { Token } from "../../lib/model/token";

export interface FTHTMLConfig {
    rootDir: string,
    keepTreeStructure: boolean,
    extends: string[],
    excluded: string[],
    importDir: string,
    exportDir: string,
    jsonDir: string,
    prettify: boolean,
    isdebug: boolean,
    globalvars: {},
    tinytemplates: {}
}

export const defaults = {
    rootDir: <string>null,
    keepTreeStructure: <boolean>false,
    extends: <string[]>[],
    excluded: <string[]>[],
    importDir: <string>null,
    exportDir: <string>null,
    jsonDir: <string>null,
    prettify: <boolean>false,
    isdebug: <boolean>false,
    globalvars: {},
    tinytemplates: {}
}

function isKeyword(word: any) {
    return word === 'this' ||
        grammar.macros[word] !== undefined ||
        grammar.functions[word] !== undefined ||
        grammar.elangs[word] !== undefined ||
        grammar.keywords.indexOf(word) !== -1 ||
        grammar.pragmas.indexOf(word) !== -1 ||
        grammar.operators.indexOf(word) !== -1 ||
        grammar.stringSymbols.indexOf(word) !== -1;
}

function setGlobalVars(json, configuration) {
    Object.keys(json['globalvars']).forEach(gvar => {
        gvar = gvar.trim();
        if (isKeyword(gvar) || !_.isTypeOf(json['globalvars'][gvar], 'string'))
            return;

        configuration.globalvars[gvar] = json['globalvars'][gvar];
    })
}

function setGlobalTinyTemplates(json, origin, configuration) {
    Object.keys(json['globalTinyTemplates']).forEach(val => {
        val = val.trim();
        if (isKeyword(val) || !_.isTypeOf(json['globalTinyTemplates'][val], 'string'))
            return;

        configuration.tinytemplates[val] = FTHTMLElement.TinyTemplate.create(new Token(Token.TYPES.STRING,
            json['globalTinyTemplates'][val],
            Token.Position.create(0, 0)
        ), origin)
    })
}

export async function parseFTHTMLConfig(filepath: string): Promise<{ configs: FTHTMLConfig, fileExists: boolean }> {
    let file = await _.getJSON(filepath);
    if (file !== null) {
        const thisconfig = Object.assign({}, defaults);
        const { json: parsed, content } = file;

        //extends
        if (parsed['extend']) {
            const exts = parsed.extend;
            for (const ext of exts) {
                if (!_.isTypeOf(ext, 'string'))
                    continue;

                const location = path.isAbsolute(ext)
                    ? ext
                    : ext.startsWith('http') ? ext : path.resolve(path.dirname(filepath), ext);
                const file = await _.getJSON(location, ext, content, filepath);
                if (file === null) continue;
                const { json } = file;
                thisconfig.extends.push(location);

                if (json['globalvars']) setGlobalVars(json, thisconfig);
                if (json['globalTinyTemplates']) setGlobalTinyTemplates(json, location, thisconfig);
                if (json['excluded']) thisconfig.excluded.push(...json.excluded);
                if (json['importDir']) thisconfig.importDir = path.resolve(json.importDir);
                if (json['exportDir']) thisconfig.exportDir = path.resolve(json.exportDir);
                if (json['jsonDir']) thisconfig.jsonDir = path.resolve(json.jsonDir);
            }
        }

        //rootDir
        if (_.isTypeOfAndNotEmpty(parsed.rootDir, 'string'))
            thisconfig.rootDir = path.resolve(parsed.rootDir);

        //keepTreeStructure
        if (_.isTypeOf(parsed.keepTreeStructure, 'boolean'))
            thisconfig.keepTreeStructure = parsed.keepTreeStructure;

        //prettify
        if (_.isTypeOf(parsed.prettify, 'boolean'))
            thisconfig.prettify = parsed.prettify;

        //excluded
        if (Array.isArray(parsed.excluded)) {
            if (_.isTypesOfAndNotEmpty(parsed.excluded, 'string'))
                thisconfig.excluded.push(...parsed.excluded);
        }

        //importDir
        if (_.isTypeOfAndNotEmpty(parsed.importDir, 'string'))
            thisconfig.importDir = path.resolve(parsed.importDir);

        //jsonDir
        if (_.isTypeOfAndNotEmpty(parsed.jsonDir, 'string'))
            thisconfig.jsonDir = path.resolve(parsed.jsonDir);

        //exportDir
        if (_.isTypeOfAndNotEmpty(parsed.exportDir, 'string'))
            thisconfig.exportDir = path.resolve(parsed.exportDir);

        //global vars
        if (_.isTypeOf(parsed.globalvars, 'object'))
            setGlobalVars(parsed, thisconfig);

        //global tinytemplates
        if (_.isTypeOf(parsed.globalTinyTemplates, 'object'))
            setGlobalTinyTemplates(parsed, filepath, thisconfig);

        //isdebug
        if (_.isTypeOf(parsed.debug, 'boolean'))
            thisconfig.isdebug = parsed.debug;

        thisconfig.excluded = Array.from(new Set(thisconfig.excluded));
        return {
            configs: thisconfig,
            fileExists: true
        }
    }

    return Promise.resolve({
        configs: defaults,
        fileExists: false
    });
}

export function merge(config : FTHTMLConfig, fromConfig: FTHTMLConfig) {
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

export default parseFTHTMLConfig;