"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let traces = [];
const Trace = function (caller, position, file) {
    return {
        caller,
        position,
        file
    };
};
class Stack {
    static add(file, action) {
        traces.unshift(Trace(action || null, null, file));
    }
    static remove(count) {
        traces = traces.slice(count);
        Stack.updateCaller(0, null);
    }
    static get(index) {
        if (!traces[index])
            traces[index] = Trace(null, null, "");
        return traces[index];
    }
    static updateCaller(index, caller) {
        if (!traces[index])
            traces[index] = Trace(null, null, "");
        if (traces[index] && traces[index].file !== '')
            traces[index].caller = caller;
    }
    static updatePosition(index, position) {
        if (!traces[index])
            traces[index] = Trace(null, null, "");
        traces[index].position = position;
    }
    static update(index, caller, position) {
        Stack.updateCaller(index, caller);
        Stack.updatePosition(index, position);
    }
    static toString() {
        return `${traces.filter(f => f.position !== null).map(m => `at ${m.caller == null ? '' : m.caller + ' '}(${m.file}:${m.position.line}:${m.position.column})`).join("\n    ")}`;
    }
}
exports.default = Stack;
