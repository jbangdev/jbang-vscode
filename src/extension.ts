import { ExtensionContext } from "vscode";
import { Assets } from "./Assets";
import { JBangCodeActions } from "./codeactions/JBangCodeActions";
import CodeLensProvider from "./CodeLensProvider";
import CommandManager from "./CommandManager";
import JBangCompletionProvider from "./CompletionProvider";
import DependencyPasteEditProvider from "./DependencyPasteEditProvider";
import EditorListener from "./EditorListener";
import JBangConfig from "./JBangConfig";
import JBangDebugger from "./JBangDebugger";
import JBangHoverProvider from "./JBangHoverProvider";
import JBangRunner from "./JBangRunner";

export let version = "Unknown";

export async function activate(context: ExtensionContext) {
  version = context.extension.packageJSON.version;
  JBangConfig.initialize(context);
  JBangRunner.initialize(context);
  Assets.initialize(context);
  CommandManager.initialize(context);
  EditorListener.initialize(context);
  JBangDebugger.initialize(context);
  CodeLensProvider.initialize(context);
  JBangCompletionProvider.initialize(context);
  JBangHoverProvider.initialize(context);
  JBangCodeActions.initialize(context);
  DependencyPasteEditProvider.initialize(context);
  console.log(
    `${context.extension.packageJSON.name} ${version} is now active!`
  );
}

export function deactivate() {}
