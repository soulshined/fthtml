declare module "ftHTML" {
    /**
     * Compile ftHTML syntax without reading a file
     *
     * @Note This permits all ftHTML functionality, like imports
     *
     * @param src string text to compile.
     * @param configPath absolute path to an fthtmlconfig.json file
     */
    export function compile(src: string, configPath?: string): string;

    /**
     * Render ftHTML syntax from a file
     *
     * @Note only permitted files are .ftHTML files
     *
     * @param file string name of file to compile excluding the extension.
     * @param configPath absolute path to an fthtmlconfig.json file
     */
    export function renderFile(file: string, configPath?: string): string;
}