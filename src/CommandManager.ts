import { commands, ExtensionContext, TextEditor, Uri, window } from "vscode";
import JBangRunner from "./JBangRunner";
import { isJBangFile } from "./JBangUtils";
import JBangInstallAppWizard from "./wizards/JBangInstallAppWizard";
import JBangScriptWizard from "./wizards/JBangScriptWizard";
export const JAVA_EXECUTE_WORKPACE_COMMAND = 'java.execute.workspaceCommand';
export const JDTLS_JBANG_SYNCHRONIZE_COMMAND = 'jbang/synchronize';
export class CommandManager {
    public async initialize(context: ExtensionContext) {
        //console.log("CommandManager.initialize");
        context.subscriptions.push(
            commands.registerCommand('jbang.synchronize', async (uri) => {
                return this.synchronizeJBangRequest(uri);
            }),
            commands.registerCommand('jbang.script.run', async (uri) => {
                return JBangRunner.runJBang(uri);
            }),
            commands.registerCommand('jbang.script.generate', async () => {
                return JBangScriptWizard.open();
            }),
            commands.registerCommand('jbang.script.export.native', async (uri) => {
                return JBangRunner.exportNative(uri);
            }),
            commands.registerCommand('jbang.script.app.install', async (uri) => {
                if (!uri) {
                    const activeEditor: TextEditor | undefined = window.activeTextEditor;
		            if (activeEditor && isJBangFile(activeEditor.document.getText())) {
                        uri = activeEditor.document.uri;
                    }
                }
                if (!uri) {
                    window.showErrorMessage("Not a JBang script!");
                    return;
                }
                return JBangInstallAppWizard.open(uri);
            })
        );
    }

    private async synchronizeJBangRequest(uris?: Uri | Uri[]) {
        //console.log("CommandManager.synchronize "+uris);
        let resources:string[] = [];
        if (!uris) {
            const activeFileUri: Uri | undefined = window.activeTextEditor?.document.uri;
            if (activeFileUri ) {//&& isJBangFile(activeFileUri.fsPath)
                resources = [activeFileUri.toString()];
            }
        } else if (uris instanceof Uri) {
            resources.push(uris.toString());
        } else if (Array.isArray(uris)) {
            for (const uri of uris) {
                if (uri instanceof Uri) {
                    resources.push(uri.toString());
                }
            }
        }
        if (resources.length == 0) {
            return;
        }
        return commands.executeCommand(JAVA_EXECUTE_WORKPACE_COMMAND, JDTLS_JBANG_SYNCHRONIZE_COMMAND, resources);
    }
}

export default new CommandManager();