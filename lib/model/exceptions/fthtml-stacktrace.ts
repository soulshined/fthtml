import { Token } from "../../model/token";

let traces: Trace[] = [];

const Trace = function (caller: string, position: Token.Position, file: string) {
    return {
        caller,
        position,
        file
    }
}

type Trace = {
    caller: string,
    position: Token.Position,
    file: string
}

export default class Stack {
    static clear() {
        traces = [];
    }
    static add(file: string, action?: string) {
        traces.unshift(Trace(action || null, null, file));
    }
    static remove(count: number) {
        traces = traces.slice(count);
        Stack.updateCaller(0, null);
    }
    static get(index: number): Trace {
        if (!traces[index])
            traces[index] = Trace(null, null, "")

        return traces[index];
    }
    static updateCaller(index: number, caller: string) {
        if (!traces[index])
            traces[index] = Trace(null, null, "")

        if (traces[index] && traces[index].file !== '')
            traces[index].caller = caller;
    }
    static updatePosition(index: number, position: Token.Position) {
        if (!traces[index])
            traces[index] = Trace(null, null, "")

        traces[index].position = position;
    }
    static update(index: number, caller: string, position: Token.Position) {
        Stack.updateCaller(index, caller);
        Stack.updatePosition(index, position);
    }
    static toString() {
        return `${traces.filter(f => f.position !== null).map(m => `at ${m.caller == null ? '' : m.caller + ' '}(${m.file}:${m.position.line}:${m.position.column})`).join("\n    ")}`;
    }
}
