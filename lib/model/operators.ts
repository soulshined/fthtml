export namespace Operator {
    export enum TYPES {
        EQ = 'eq',
        NE = 'ne',
        GT = 'gt',
        GE = 'ge',
        LT = 'lt',
        LE = 'le',
        IE = 'ie',
        CONTAINS = 'contains',
        ICONTAINS = 'icontains',
        ISTARTS = 'istarts',
        STARTS = 'starts',
        IENDS = 'iends',
        ENDS = 'ends',
        MATCH = 'match',
        IMATCH = 'imatch'
    };

    export namespace TYPES {
        export function getAllTypes(): TYPES[] {
            const types: TYPES[] = [];
            Object.keys(TYPES).forEach(key =>{
                if (typeof TYPES[key] === 'string')
                    types.push(TYPES[key]);
            })
            return types;
        }
    }
}