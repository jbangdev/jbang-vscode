import { Uri, window } from "vscode";
import { isJBangFile } from "../JBangUtils";

export async function handleCommand(
  callback: (uri: Uri) => Promise<any>,
  uri: any
) {
  const scriptUri = getValidScriptUri(uri);
  if (scriptUri) {
    return callback(scriptUri);
  }
  showErrorMessage();
}

export function getValidScriptUri(uri?: Uri): Uri | undefined {
  if (uri) {
    return uri;
  }
  const activeEditor = window.activeTextEditor;
  if (
    activeEditor &&
    activeEditor.document &&
    isJBangFile(activeEditor.document.getText())
  ) {
    return activeEditor.document.uri;
  }
}

export function showErrorMessage() {
  window.showErrorMessage("You must select a JBang script");
}
