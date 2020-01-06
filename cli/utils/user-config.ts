import * as _ from "./frequent";
import * as path from "path";

const fthtmlconfig = path.resolve(process.cwd(), 'fthtmlconfig.json');

const config = {
    rootDir: <string>null,
    keepTreeStructure: <boolean>false,
    excluded: <string[]>[],
    importDir: <string>null,
    exportDir: <string>null,
    templateDir: <string>null
}

if (_.fileExists(fthtmlconfig)) {
    const parsed = _.getJSONFromFile(fthtmlconfig);

    //rootDir
    if (_.isTypeOfAndNotEmpty(parsed.rootDir, 'string'))
        config.rootDir = path.resolve(parsed.rootDir);

    //keepTreeStructure
    if (_.isTypeOf(parsed.keepTreeStructure, 'boolean'))
        config.keepTreeStructure = parsed.keepTreeStructure;

    //excluded
    if (Array.isArray(parsed.excluded)) {
        if (_.isTypesOfAndNotEmpty(parsed.excluded, 'string'))
            config.excluded = parsed.excluded;
    }

    //importDir
    if (_.isTypeOfAndNotEmpty(parsed.importDir, 'string'))
        config.importDir = path.resolve(parsed.importDir);

    //exportDir
    if (_.isTypeOfAndNotEmpty(parsed.exportDir, 'string'))
        config.exportDir = path.resolve(parsed.exportDir);

    //templateDir
    if (_.isTypeOfAndNotEmpty(parsed.templateDir, 'string'))
        config.templateDir = path.resolve(parsed.templateDir);
}

export default config;