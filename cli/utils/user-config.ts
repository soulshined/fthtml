import * as path from "path";
import parseFTHTMLConfig from "./user-config-helper";

const fthtmlconfig = path.resolve(process.cwd(), 'fthtmlconfig.json');
export default parseFTHTMLConfig(fthtmlconfig);