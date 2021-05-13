
export namespace TYPES {
    export type char = string;

    export interface Cloneable<T> {
        clone(): T;
    }
}