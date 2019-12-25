if (!String.prototype.matchAll)
    String.prototype.matchAll = function (regexp) {
        let match;
        let matches = [];
        while ((match = regexp.exec(this)) !== null) {
            matches.push([...match]);
        }
        return matches;
    }