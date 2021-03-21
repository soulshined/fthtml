import * as fs from "fs";
import { TOKEN_TYPE } from "../../lib/lexer/types";
import { ftHTMLImportError } from "../../lib/utils/exceptions";

export function fileExists(file: string): boolean {
    try {
        return fs.existsSync(file);
    } catch (err) {
        return false;
    }
}

export function getJSONFromFile(file: string, extendLocation?: string, inContent?: string, parent?: string) {
    if (!fileExists(file) || !file.endsWith('.json')) {
        if (extendLocation) {
            let isInExtend = false;
            let line = 0;
            let col = 0;
            const lines = inContent.split("\n");
            for (let i = 0; i < lines.length; ++i) {
                if (isInExtend) {
                    if (lines[i].trim() === `"${extendLocation}"`) {
                        line = i;
                        col = lines[i].indexOf(`"${extendLocation}"`);
                        break;
                    }
                }
                else if (lines[i].trim().startsWith('"extend"')) {
                    isInExtend = true;
                }
            }
            throw new ftHTMLImportError(`JSON file '${file}' doesn't exist or isn't compatible`, {
                type: TOKEN_TYPE.KEYWORD,
                value: 'extend',
                position: {
                    line : line  + 1,
                    column : col + 1
                }
            }, parent);
        }

        return null;
    }

    try {
        const content = fs.readFileSync(file, 'utf8');
        return {
            origin: file,
            content,
            json: JSON.parse(content)
        };
    } catch (error) {
        return null;
    }
}

export function isTypeOf(aObject: any, expecting: any): boolean {
    return typeof aObject === expecting;
}

export function isTypeOfAndNotEmpty(aObject: any, expecting: any): boolean {
    return isTypeOf(aObject, expecting) && aObject.length > 0;
}

export function isTypesOfAndNotEmpty(aObject: any, expecting: any): boolean {
    let obj = aObject;
    if (isTypeOf(aObject, 'object'))
        obj = Object.values(aObject);

    return obj.every((e: any) => isTypeOfAndNotEmpty(e, expecting) && e.length > 0);
}

let aTimer = null;
export class Timer {
    static start() {
        aTimer = new Date().getTime();
    }
    static end() {
        console.log('Duration:', Math.max(new Date().getTime() - aTimer, 0), 'ms');
        aTimer = null;
    }
}