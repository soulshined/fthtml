"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const scripttag = (code) => `<script>document.write(${code});</script>`;
const rscripttag = (code) => `<script>(function() {
    ${code}
})();</script>`;
const macros = {
    __DATE__: () => {
        const [day, date, month, year, ..._] = new Date().toUTCString().split(' ');
        return `${date} ${month} ${year}`;
    },
    __DATETIME__: () => {
        const [day, date, month, year, time] = new Date().toUTCString().split(' ');
        return `${date} ${month} ${year} ${time}`;
    },
    __ISO_DATE__: () => new Date().toISOString(),
    __LOCAL_DATE__: () => {
        const [day, month, date, year] = new Date().toDateString().split(' ');
        return `${date} ${month} ${year}`;
    },
    __LOCAL_DATETIME__: () => {
        const [day, month, date, year, time] = new Date().toString().split(' ');
        return `${date} ${month} ${year} ${time}`;
    },
    __NOW__: () => new Date().getTime(),
    __UUID__: () => crypto_1.randomBytes(16).toString("hex"),
    __JS_DATE__: () => rscripttag(`
            const [day, date, month, year, ..._] = new Date().toUTCString().split(' ');
            document.write(\`\${date} \${month} \${year}\`);
            `),
    __JS_DATETIME__: () => rscripttag(`
            const [day, date, month, year, time] = new Date().toUTCString().split(' ');
            document.write(\`\${date} \${month} \${year} \${time}\`);
            `),
    __JS_ISO_DATE__: () => scripttag(`new Date().toISOString()`),
    __JS_LOCAL_DATE__: () => rscripttag(`
            const [day, month, date, year] = new Date().toDateString().split(' ');
            document.write(\`\${date} \${month} \${year}\`);
            `),
    __JS_LOCAL_DATETIME__: () => rscripttag(`
            const [day, month, date, year, time] = new Date().toString().split(' ');
            document.write(\`\${date} \${month} \${year} \${time}\`);
            `),
    __JS_NOW__: () => scripttag(`new Date().getTime()`),
    __JS_AGENT__: () => scripttag('window.navigator.userAgent'),
    __JS_URI__: () => scripttag('window.location.href'),
    __JS_URI_HASH__: () => scripttag('window.location.hash'),
    __JS_URI_HOSTNAME__: () => scripttag('window.location.hostname'),
    __JS_URI_HOST__: () => scripttag('window.location.host'),
    __JS_URI_PORT__: () => scripttag('window.location.port'),
    __JS_URI_PATH__: () => scripttag('window.location.pathname'),
    __JS_URI_PROTOCOL__: () => scripttag('window.location.protocol'),
    __JS_URI_SEARCH__: () => scripttag('window.location.search')
};
exports.default = macros;
//# sourceMappingURL=macros.js.map