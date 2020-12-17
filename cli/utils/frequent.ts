import * as fs from "fs";

export function fileExists(file: string): boolean {
    try {
        return fs.existsSync(file);
    } catch (err) {
        return false;
    }
}

export function getJSONFromFile(file: string) {
    if (fileExists(file))
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    else
        return null;
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