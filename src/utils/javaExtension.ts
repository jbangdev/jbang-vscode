/* eslint-disable @typescript-eslint/naming-convention */
import { commands, extensions, ProgressLocation, window } from "vscode";
// alias for vscode-java's ExtensionAPI
export type JavaExtensionAPI = any;
export const JAVA_EXTENSION_ID = "redhat.java";

export async function getJavaExtensionAPI(): Promise<JavaExtensionAPI> {
    const vscodeJava = extensions.getExtension(JAVA_EXTENSION_ID);
    if (!vscodeJava) {
      return Promise.resolve(undefined);
    }
  
    const api = await vscodeJava.activate();
    return Promise.resolve(api);
  }

export enum ServerMode {
  STANDARD = "Standard",
  LIGHTWEIGHT = "LightWeight",
  HYBRID = "Hybrid",
}

/**
 * Returns true if the Java server is in standard mode or the user allows it to be changed to standard mode, and false otherwise.
 *
 * Adopted from https://github.com/microsoft/vscode-java-debug/blob/master/src/utility.ts#L214
 *
 * @param opName The operation that requires standard mode
 * @returns true if the Java server is in standard mode or the user allows it to be changed to standard mode, and false otherwise.
 */
export async function requestStandardMode(opName: string): Promise<boolean> {
  const extension = extensions.getExtension(JAVA_EXTENSION_ID);
  if (!extension) {
    return false;
  }
  const api = await getJavaExtensionAPI();
  if (api && api.serverMode === ServerMode.LIGHTWEIGHT) {
    const answer = await window.showInformationMessage(`${opName} requires the Java language server to run in Standard mode. ` +
      "Do you want to switch it to Standard mode now?", "Yes", "Cancel");
    if (answer === "Yes") {
      return window.withProgress<boolean>({ location: ProgressLocation.Window }, async (progress) => {
        if (api.serverMode === ServerMode.STANDARD) {
          return true;
        }
        progress.report({ message: "Switching to Standard mode..." });
        return new Promise<boolean>((resolve) => {
          api.onDidServerModeChange((mode: string) => {
            if (mode === ServerMode.STANDARD) {
              resolve(true);
            }
          });
          commands.executeCommand("java.server.mode.switch", ServerMode.STANDARD, true);
        });
      });
    }
    return false;
  } else if (api && api.serverMode === ServerMode.HYBRID) {
    return new Promise<boolean>((resolve) => {
      api.onDidServerModeChange((mode: string) => {
        if (mode === ServerMode.STANDARD) {
          resolve(true);
        }
      });
    });
  }
  return true;
}

/**
 * Returns a promise that resolves when the Java server is in standard mode
 *
 * If the java extension is not installed, this promise never resolves.
 * This promise never rejects.
 */
export async function waitForStandardMode(): Promise<void> {
  const javaExtApi = await getJavaExtensionAPI();
  return new Promise((resolve) => {
    javaExtApi.onDidServerModeChange((mode: string) => {
      if (mode === ServerMode.STANDARD) {
        resolve();
      }
    });
  });
}

/**
 * Request vscode-java standard mode, then try to run the given action in standard mode.
 *
 * @param action A function to perform that requires standard mode
 * @param actionDescription Human legible description of what is trying to be accomplished
 */
export function runWithStandardMode(action: () => void, actionDescription: string) {
  requestStandardMode(actionDescription).then((isStandardMode) => {
    if (isStandardMode) {
        action();
    }
  });
}
