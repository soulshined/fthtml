import { Token } from "./token";

export class FTHTMLElement {
    private _attrs?: FTHTMLElement.Attributes;
    private _parsedValue?: string;
    private _token: Token<Token.TYPES>;
    private _isParentElement: boolean = false;
    private _childrenStart?: Token.Position;
    private _childrenEnd?: Token.Position;
    private _children: FTHTMLElement[];

    constructor(token: Token<Token.TYPES>, parsedValue?: string, children: FTHTMLElement[] = [], attrs?: FTHTMLElement.Attributes) {
        this._attrs = attrs;
        this._token = token;
        this.children = children;
        this.parsedValue = parsedValue;
    }

    public get isParentElement(): boolean {
        return this._isParentElement;
    }

    public set isParentElement(v: boolean) {
        this._isParentElement = v;
    }

    public get parsedValue(): string {
        return this._parsedValue;
    }

    public set parsedValue(v: string) {
        this._parsedValue = v;
    }

    public get childrenStart(): Token.Position {
        return this._childrenStart;
    }

    public set childrenStart(v: Token.Position) {
        this._childrenStart = v;
    }

    public get childrenEnd(): Token.Position {
        return this._childrenEnd;
    }

    public set childrenEnd(v: Token.Position) {
        this._childrenEnd = v;
    }

    public get children(): FTHTMLElement[] {
        return this._children;
    }

    public set children(v: FTHTMLElement[]) {
        this._children = v;
    }

    public get attrs(): FTHTMLElement.Attributes {
        return this._attrs;
    }

    public set attrs(v: FTHTMLElement.Attributes) {
        this._attrs = v;
    }

    public get token(): Token<Token.TYPES> {
        return this._token;
    }

    public clone() {
        const newElement = new FTHTMLElement(this.token.clone(), this.parsedValue);
        newElement.children = this.children.map(c => c.clone());
        newElement.attrs = this.attrs?.clone();
        newElement.isParentElement = this.isParentElement;
        newElement.childrenStart = this.childrenStart;
        newElement.childrenEnd = this.childrenEnd;
        return newElement;
    }

}

export namespace FTHTMLElement {
    export interface TinyTemplate {
        element?: Token<Token.TYPES>,
        attrs?: Attributes,
        value: Token<Token.TYPES>,
        origin: string,
        clone: () => TinyTemplate;
    }

    export class Attributes extends Map<string, FTHTMLElement[]> {

        public get default(): Attributes {
            return new Attributes([
                ['id', []],
                ['classes', []],
                ['kvps', []],
                ['misc', []]
            ])
        }

        clone(): Attributes {
            return new Attributes([
                ['id', [...this.get('id')]],
                ['classes', [...this.get('classes')]],
                ['kvps', [...this.get('kvps')]],
                ['misc', [...this.get('misc')]]
            ]);
        }
    }

    export namespace TinyTemplate {
        export function create(value: Token<Token.TYPES>, origin: string, element?: Token<Token.TYPES>, attrs?: Attributes): TinyTemplate {
            return {
                element,
                attrs,
                value,
                origin,
                clone: () => create(value.clone(), origin, element?.clone(), attrs?.clone())
            }
        }
    }
}