import * as fs from "fs";
import { FTHTMLExceptions } from "../../lib/model/exceptions/fthtml-exceptions";
import { Token } from "../../lib/model/token";

export function fileExists(file: string): boolean {
    try {
        return fs.existsSync(file);
    } catch (err) {
        return false;
    }
}

export async function getJSON(uri: string, extendLocation?: string, inContent?: string, parent?: string): Promise<{
    origin: string,
    content: string,
    json: any
}> {
    const extendedLocs = [0, 0];
    if (extendLocation) {
        let isInExtend = false;
        const lines = inContent.split("\n");
        for (let i = 0; i < lines.length; ++i) {
            if (isInExtend) {
                if (lines[i].trim() === `"${extendLocation}"`) {
                    extendedLocs[0] = i;
                    extendedLocs[1] = lines[i].indexOf(`"${extendLocation}"`);
                    break;
                }
            }
            else if (lines[i].trim().startsWith('"extend"')) {
                isInExtend = true;
            }
        }
    }

    if (uri.endsWith('.json') && uri.startsWith('http')) {
        const content = await getRemoteJson(uri)
            .catch(err => {
                if (extendLocation)
                    throw new FTHTMLExceptions.Import(err, new Token(Token.TYPES.KEYWORD, 'extend', Token.Position.create(extendedLocs[0] + 1, extendedLocs[1] + 1)), parent);
                return Promise.resolve(null);
            });

        try {
            return Promise.resolve({
                origin: uri,
                content,
                json: JSON.parse(content)
            })
        }
        catch (err) {
            return Promise.resolve(null);
        }
    }

    if (!fileExists(uri) || !uri.endsWith('.json')) {
        if (extendLocation)
            throw new FTHTMLExceptions.Import(`JSON file '${uri}' doesn't exist or isn't compatible`, new Token(Token.TYPES.KEYWORD, 'extend', Token.Position.create(extendedLocs[0] + 1, extendedLocs[1] + 1)), parent);
        return Promise.resolve(null);
    }

    try {
        const content = fs.readFileSync(uri, 'utf8');
        return Promise.resolve({
            origin: uri,
            content,
            json: JSON.parse(content)
        });
    } catch (error) {
        return Promise.resolve(null);
    }
}

async function getRemoteJson(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const http = require(url.startsWith('https') ? 'https' : 'http');
        const options = {
            timeout: 10000
        }
        let data = '';
        http.get(url, options, res => {
            const { statusCode, headers: { 'content-type': contentType } } = res;

            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (statusCode === 302)
                    resolve(getRemoteJson(res.headers.location));
                else if (statusCode === 200 && !/^application\/json/.test(contentType)) reject(`Invalid content type for extended config '${url}'`);
                else if (statusCode === 200) resolve(data);
                else if (statusCode === 404) reject(`Extended config '${url}' can't be found`)
                else reject(`Extended config error for url '${url}'`);
            })
        }).on('error', error => reject(`Extended config error for url '${url}': ${error}`));
    })
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