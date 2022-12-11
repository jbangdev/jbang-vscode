import { ExtensionContext, Terminal, Uri, window } from "vscode";
import { jbang } from "./JBangExec";
import { ITerminalOptions, terminalCommandRunner } from "./terminal/terminalCommandRunner";

export class JBangRunner {

    constructor() { }

    public initialize(context: ExtensionContext) {
        context.subscriptions.push(terminalCommandRunner);
        context.subscriptions.push(
            window.onDidCloseTerminal((closedTerminal: Terminal) => {
                terminalCommandRunner.dispose(closedTerminal.name);
            })
        );
    }

    public async runJBang(uri: Uri): Promise<Terminal> {
        const exec = jbang();
        const command = `${exec} "${uri.fsPath}"`;
        const name = "JBang - " + uri.fsPath.substring(uri.fsPath.lastIndexOf("/") + 1);
        let terminalOptions = { name } as ITerminalOptions;
        return await terminalCommandRunner.runInTerminal(command, terminalOptions);
    }

    public async exportNative(uri: Uri): Promise<Terminal> {
        const exec = jbang();
        const command = `${exec} export native "${uri.fsPath}"`;
        const name = "JBang - " + uri.fsPath.substring(uri.fsPath.lastIndexOf("/") + 1);
        let terminalOptions = { name } as ITerminalOptions;
        return await terminalCommandRunner.runInTerminal(command, terminalOptions);
    }

    public async appInstall(uri: Uri,isNative: boolean, appName?: string): Promise<Terminal> {
        const exec = jbang();
        let options = '--force ';
        if (isNative) {
            options += '--native ';
        }
        if (appName) {
            options += `--name ${appName} `;
        }
        const command = `${exec} app install ${options} "${uri.fsPath}"`;
        const name = "JBang - " + uri.fsPath.substring(uri.fsPath.lastIndexOf("/") + 1);
        let terminalOptions = { name } as ITerminalOptions;
        return await terminalCommandRunner.runInTerminal(command, terminalOptions);
    }
}

export default new JBangRunner();