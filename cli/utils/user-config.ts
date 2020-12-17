import * as _ from "./frequent";
import * as path from "path";
import { default as macros } from "../../lib/lexer/grammar/macros";

const fthtmlconfig = path.resolve(process.cwd(), 'fthtmlconfig.json');

const config = {
    rootDir: <string>null,
    keepTreeStructure: <boolean>false,
    excluded: <string[]>[],
    importDir: <string>null,
    exportDir: <string>null,
    jsonDir: <string>null,
    prettify: <boolean>false,
    globalvars: {}
}

if (_.fileExists(fthtmlconfig)) {
    const parsed = _.getJSONFromFile(fthtmlconfig);

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
            config.excluded = parsed.excluded;
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
    if (_.isTypeOf(parsed.globalvars, 'object')) {
        if (_.isTypesOfAndNotEmpty(parsed.globalvars, 'string'))
            config.globalvars = parsed.globalvars;

        Object.keys(config.globalvars).forEach(gvar => {
            if (macros[gvar] !== undefined)
                delete config.globalvars[gvar]
        })
    }
}

export default config;