import { ExtensionContext, Terminal, Uri, window } from "vscode";
import { ITerminalOptions, terminalCommandRunner } from "./terminal/terminalCommandRunner";

export class JBangRunner {

    public initialize(context: ExtensionContext) {
        context.subscriptions.push(terminalCommandRunner);
        context.subscriptions.push(
            window.onDidCloseTerminal((closedTerminal: Terminal) => {
                terminalCommandRunner.dispose(closedTerminal.name);
            })
        );
    }

    public async runJBang(uri: Uri): Promise<Terminal> {
        const exec = this.jbang();
        const command = `${exec} ${uri.fsPath}`;
        const name = "JBang - " + uri.fsPath.substring(uri.fsPath.lastIndexOf("/") + 1);
        let terminalOptions = { name } as ITerminalOptions;
        return await terminalCommandRunner.runInTerminal(command, terminalOptions);
    }

    private isWin():boolean {
        return /^win/.test(process.platform);
    }
    
    private jbang():string {
        return this.isWin()?"jbang.cmd":"jbang";
    }
}


export default new JBangRunner();