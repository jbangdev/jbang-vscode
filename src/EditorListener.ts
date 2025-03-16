import { commands, ExtensionContext, TextEditor, window } from "vscode";
import { isJBangFile, isJBangSupported } from "./JBangUtils";

export class EditorListener {
  public async initialize(context: ExtensionContext): Promise<void> {
    //console.log("EditorListener.initialize");
    context.subscriptions.push(
      window.onDidChangeActiveTextEditor((editor) => {
        return this.checkJBangFileContext(editor);
      })
    );
    this.checkJBangFileContext(window.activeTextEditor);
  }

  checkJBangFileContext(editor?: TextEditor) {
    //If not a java file, we bail
    if (!editor || !editor.document || !isJBangSupported(editor.document)) {
      return this.setJBangFileContext(false);
    }
    if (editor.document.fileName.endsWith("build.jbang")) {
      return this.setJBangFileContext(true);
    }

    const content = editor.document.getText();
    if (!content) {
      return this.setJBangFileContext(false);
    }

    const isJBangScript = isJBangFile(content);
    //console.log(editor.document.uri+" isJBangFile: " + isJBangScript);
    return this.setJBangFileContext(isJBangScript);
  }

  setJBangFileContext(value: boolean) {
    return commands.executeCommand("setContext", "isJBangFile", value);
  }
}
export default new EditorListener();
