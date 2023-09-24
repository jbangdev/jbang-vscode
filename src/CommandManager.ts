import { commands, ExtensionContext, Uri } from "vscode";
import JBangRunner from "./JBangRunner";

import { getValidScriptUri, handleCommand, showErrorMessage } from "./utils/commandHelper";
import JBangAddMissingDependencyWizard from "./wizards/JBangAddMissingDependencyWizard";
import JBangInstallAppWizard from "./wizards/JBangInstallAppWizard";
import JBangScriptWizard from "./wizards/JBangScriptWizard";
export const JAVA_EXECUTE_WORKPACE_COMMAND = 'java.execute.workspaceCommand';
export const JDTLS_JBANG_SYNCHRONIZE_COMMAND = 'jbang/synchronize';
export const JBANG_ADD_MISSING_DEPENDENCY = 'jbang.add.missing.dependency';

export class CommandManager {
    public async initialize(context: ExtensionContext) {
        context.subscriptions.push(
            commands.registerCommand('jbang.synchronize',this.synchronizeJBangRequest),
            commands.registerCommand('jbang.script.run', handleCommand.bind(this, JBangRunner.runJBang)),
            commands.registerCommand('jbang.script.export.native', handleCommand.bind(this, JBangRunner.exportNative)),
            commands.registerCommand('jbang.script.app.install', handleCommand.bind(this, JBangInstallAppWizard.open)),
            commands.registerCommand('jbang.script.generate', JBangScriptWizard.open),
            commands.registerCommand(JBANG_ADD_MISSING_DEPENDENCY, this.handleMissingDependencyCommand.bind(this)),
        );
    }

    private async synchronizeJBangRequest(uris?: Uri | Uri[]) {
        let resources:string[] = [];
        if (!uris) {
            const activeFileUri = getValidScriptUri();
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
        if (resources.length === 0) {
            return;
        }
        return commands.executeCommand(JAVA_EXECUTE_WORKPACE_COMMAND, JDTLS_JBANG_SYNCHRONIZE_COMMAND, resources);
    }

    private async handleMissingDependencyCommand(uri: any, missingType: string) {
        if (!missingType) {
            return;
        }
        const scriptUri = getValidScriptUri(uri);
        if (scriptUri) {
            return JBangAddMissingDependencyWizard.open(scriptUri, missingType);
        }
        showErrorMessage();
    }
}

export default new CommandManager();