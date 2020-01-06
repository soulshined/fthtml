import { tokenposition } from "../../lexer/token";

let traces: Trace[] = [];

const Trace = function (caller: string, position: tokenposition, file: string) {
    return {
        caller,
        position,
        file
    }
}

type Trace = {
    caller: string,
    position: tokenposition,
    file: string
}

export default class Stack {
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
    static updatePosition(index: number, position: tokenposition) {
        if (!traces[index])
            traces[index] = Trace(null, null, "")

        traces[index].position = position;
    }
    static update(index: number, caller: string, position: tokenposition) {
        Stack.updateCaller(index, caller);
        Stack.updatePosition(index, position);
    }
    static toString() {
        return `${traces.filter(f => f.position !== null).map(m => `at ${m.caller == null ? '' : m.caller + ' '}(${m.file}:${m.position.line}:${m.position.column})`).join("\n    ")}`;
    }
}
