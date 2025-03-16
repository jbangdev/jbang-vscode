import * as path from "path";
import { QuickPickItem, Uri } from "vscode";
import JBangRunner from "../JBangRunner";
import { MultiStepInput, QuickPickParameters } from "./multiStepsUtils";
import { InstallAppState } from "./wizardState";

const DEFAULT_TOTAL_STEPS = 2;

export default class JBangInstallAppWizard {
  constructor(private uri: Uri) {}

  public static async open(uri: Uri) {
    const wizard = new JBangInstallAppWizard(uri);
    await wizard.run();
  }

  private async run() {
    const state: Partial<InstallAppState> = {
      totalSteps: DEFAULT_TOTAL_STEPS,
      appName: getName(this.uri),
    };
    await MultiStepInput.run((input) => this.inputAppName(input, state));
    if (!state.appName) {
      return;
    }
    await this.appInstall(state as InstallAppState);
  }

  private async inputAppName(
    input: MultiStepInput,
    state: Partial<InstallAppState>
  ) {
    state.appName = await input.showInputBox({
      title: "Enter the application name",
      step: state.totalSteps! - 1,
      totalSteps: state.totalSteps,
      value: state.appName || "",
      prompt: "Enter the application name",
      validate: validateName,
    });

    return (input: MultiStepInput) => this.selectNative(input, state);
  }

  private async selectNative(
    input: MultiStepInput,
    state: Partial<InstallAppState>
  ) {
    const choices: QuickPickItem[] = [];
    choices.push({ label: "Yes" });
    choices.push({ label: "No" });

    const choice = await input.showQuickPick<
      QuickPickItem,
      QuickPickParameters<QuickPickItem>
    >({
      title: "Install as native application?",
      items: choices,
      step: state.totalSteps,
      totalSteps: state.totalSteps,
      activeItem: state.native ? choices[0] : choices[1],
    });

    state.native = "Yes" === choice?.label;
  }

  private async appInstall(state: InstallAppState) {
    return JBangRunner.appInstall(this.uri, state.native, state.appName);
  }
}
async function validateName(name: string): Promise<string | undefined> {
  if (!name) {
    return "Application name is required";
  }
  if (name.includes(" ")) {
    return "Application name cannot contain spaces";
  }
  return undefined;
}

function getName(uri: Uri): string | undefined {
  return path.parse(uri.fsPath).name.toLowerCase();
}
