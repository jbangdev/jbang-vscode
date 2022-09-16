import { ExtensionContext } from "vscode";
import { Assets } from "./Assets";
import CodeLensProvider from "./CodeLensProvider";
import CommandManager from "./CommandManager";
import CompletionProvider from "./CompletionProvider";
import EditorListener from "./EditorListener";
import JBangRunner from "./JBangRunner";

export function activate(context: ExtensionContext) {
	JBangRunner.initialize(context);
	Assets.initialize(context);
	CommandManager.initialize(context);
	EditorListener.initialize(context);
	CodeLensProvider.initialize(context);
	CompletionProvider.initialize(context);
	const packageJson = require('../package.json');
	console.log(`${packageJson.name} ${packageJson.version} is now active!`);
}


export function deactivate() {}
