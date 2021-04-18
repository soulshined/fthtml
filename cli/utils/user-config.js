"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const user_config_helper_1 = require("./user-config-helper");
const fthtmlconfig = path.resolve(process.cwd(), 'fthtmlconfig.json');
exports.default = user_config_helper_1.default(fthtmlconfig).configs;
//# sourceMappingURL=user-config.js.map