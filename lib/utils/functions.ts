export function getAllMatches(str: string, regexp: RegExp): RegExpExecArray[] {
    let match: RegExpExecArray;
    let matches = [];
    while ((match = regexp.exec(str)) !== null) {
        matches.push([...match]);
    }
    return matches;
}

export function endsEscaped(str: string): boolean {
    return !!(str.match(/[\\]*$/)[0].length % 2);
}