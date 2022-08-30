import path = require("path");
import { ExtensionContext, Uri } from "vscode";

export namespace Assets {

    let extensionPath: string;

    export function initialize(extensionContext: ExtensionContext) {
        extensionPath = extensionContext.extensionPath;
    }

    export function get(assetName: string): Uri {
        return Uri.file(path.join(extensionPath, 'assets', assetName));
    } 
}