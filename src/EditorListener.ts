import { commands, ExtensionContext, TextEditor, window } from "vscode";

export class EditorListener {
    public async initialize(context: ExtensionContext): Promise<void> {
        console.log("EditorListener.initialize");
        context.subscriptions.push(
            window.onDidChangeActiveTextEditor(editor => {
                return this.checkJBangFileContext(editor);
            }
        ));
        this.checkJBangFileContext(window.activeTextEditor);
    }

    checkJBangFileContext(editor?: TextEditor) {
        //If not a java file, we bail
        if (!editor || !editor.document || "java" !== editor.document.languageId) {
            return this.setJBangFileContext(false);
        }
        const content = editor?.document.getText();
        if (!content) {
            return this.setJBangFileContext(false);
        }
        const lines = content.split(/\r?\n/);
        var isJBangFile = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith("//DEPS" || line.startsWith("//JAVA") || line.startsWith("///usr/bin/env jbang"))) {
                console.log(editor.document.uri+" isJBangFile: " + isJBangFile);
                isJBangFile = true;
                break;
            }
            
        }
        return this.setJBangFileContext(isJBangFile);
    }

    setJBangFileContext(value:boolean) {
        return commands.executeCommand('setContext', 'isJBangFile', value);
    }
}
export default new EditorListener();