import { ExtensionContext } from "vscode";
import { Assets } from "./Assets";
import CodeLensProvider from "./CodeLensProvider";
import CommandManager from "./CommandManager";
import CompletionProvider from "./CompletionProvider";
import EditorListener from "./EditorListener";
import JBangConfig from "./JBangConfig";
import JBangRunner from "./JBangRunner";

export let version = 'Unknown';

export function activate(context: ExtensionContext) {
	version = context.extension.packageJSON.version;
	JBangConfig.initialize(context);
	JBangRunner.initialize(context);
	Assets.initialize(context);
	CommandManager.initialize(context);
	EditorListener.initialize(context);
	CodeLensProvider.initialize(context);
	CompletionProvider.initialize(context);
	console.log(`${context.extension.packageJSON.name} ${version} is now active!`);
}


export function deactivate() {}
