import { Token } from "../token";

export interface FTHTMLFunctionArgument {
    types: (Token.TYPES | string)[];
    name: string;
    enum?: string[];
    isRestParameter?: boolean;
    isOptional?: boolean;
    default?: any;
}

export class Result {
    private _value: any;
    private _error: boolean;
    private _msg?: string;

    constructor(value: any, error: boolean = false, msg?: string) {
        this._error = error;
        this._msg = msg;
        this._value = value;
    }

    public get value(): any {
        return this._value;
    }

    public get error(): boolean {
        return this._error;
    }

    public get msg(): string {
        return this._msg;
    }
}

export abstract class AbstractFunction {
    readonly isArgsSequenceStrict: boolean;
    readonly shouldReturnTokenTypes: boolean;
    readonly shouldUseLiteralVariable: boolean;
    protected _argPatterns: FTHTMLFunctionArgument[];

    constructor(isSequenceStrict: boolean, returnTokenTypes: boolean = false, useLiteralVariable: boolean = false) {
        this.isArgsSequenceStrict = isSequenceStrict;
        this.shouldReturnTokenTypes = returnTokenTypes;
        this.shouldUseLiteralVariable = useLiteralVariable;
    }

    public get argPatterns(): FTHTMLFunctionArgument[] {
        return this._argPatterns;
    }

    abstract do(...values: any[]): Result;
}