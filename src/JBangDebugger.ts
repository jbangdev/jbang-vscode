import { commands, debug, DebugConfiguration, ExtensionContext, tasks, Uri, window, workspace } from "vscode";
import { JBangTaskProvider } from "./JBangTaskProvider";

export const DEBUG_WITH_JBANG_COMMAND_ID = 'jbang.script.debug';

export class JBangDebugger {

    initialize(_context: ExtensionContext) {

        tasks.registerTaskProvider('jbang', new JBangTaskProvider());

        commands.registerCommand(DEBUG_WITH_JBANG_COMMAND_ID, async (uri: Uri) => {
            if (uri !== undefined) {
                await window.showTextDocument(uri);
            }
            const debugConfiguration: DebugConfiguration = {
                name: 'Start JBang Application and debug',
                type: 'java',
                request: 'attach',
                hostName: "localhost",
                port: 4004,
                preLaunchTask: `jbang: ${JBangTaskProvider.labelProvidedTask}`
            };
            await debug.startDebugging(workspace.workspaceFolders ? workspace.workspaceFolders[0] : undefined, debugConfiguration);
        });
    }

}

export default new JBangDebugger();