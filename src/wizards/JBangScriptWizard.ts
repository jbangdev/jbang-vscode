import * as fs from "fs";
import {
  commands,
  OpenDialogOptions,
  QuickPickItem,
  Uri,
  window,
  workspace,
} from "vscode";
import { runWithStandardMode } from "../utils/javaExtension";
import { JBangTemplate } from "./JBangTemplate";
import { MultiStepInput, QuickPickParameters } from "./multiStepsUtils";
import { generateScript, listTemplates } from "./templateExec";
import { ScriptGenState } from "./wizardState";
import path = require("path");

const CUSTOM_TEMPLATE = {
  label: "$(pencil) Custom template ...",
  detail: "Manually set a custom template",
} as QuickPickItem;
const NO_TEMPLATE = {
  label: "$(close) No template",
  detail: "Do not use a template",
} as QuickPickItem;

const DEFAULT_TOTAL_STEPS = 3;

export default class JBangScriptWizard {
  private templates: JBangTemplate[] | undefined;

  public static async open() {
    const wizard = new JBangScriptWizard();
    await wizard.run();
  }

  private async run() {
    const state: Partial<ScriptGenState> = {
      totalSteps: DEFAULT_TOTAL_STEPS,
    };
    await MultiStepInput.run((input) => this.inputTemplate(input, state));
    if (!state.scriptName) {
      return;
    }
    state.targetDir = await getTargetDirectory(state.scriptName);
    if (!state.targetDir) {
      return;
    }
    try {
      const newFiles = await generateScript(state as ScriptGenState);
      if (newFiles.length > 0) {
        const scriptPath = path.join(state.targetDir.fsPath, newFiles[0]);
        const uri = Uri.file(scriptPath);
        window.showTextDocument(uri);
        runWithStandardMode(() => {
          setTimeout(() => {
            commands.executeCommand("jbang.synchronize", uri);
          }, 1000);
        }, "Synchronize JBang");
      }
    } catch (e: any) {
      window.showErrorMessage(e.message);
    }
  }

  private async inputTemplate(
    input: MultiStepInput,
    state: Partial<ScriptGenState>
  ) {
    state.totalSteps = DEFAULT_TOTAL_STEPS;

    let selectedTemplate: QuickPickItem | undefined;
    do {
      const templates: QuickPickItem[] = [];
      templates.push(NO_TEMPLATE);
      templates.push(CUSTOM_TEMPLATE);

      const jbangTemplates = (await this.getTemplates()).map((t) =>
        this.asItem(t)
      );
      templates.push(...jbangTemplates);
      selectedTemplate = await input.showQuickPick<
        QuickPickItem,
        QuickPickParameters<QuickPickItem>
      >({
        title: "Select a template",
        step: 1,
        totalSteps: state.totalSteps,
        items: templates,
        placeholder: "Select a template",
        buttons: [],
      });

      if (selectedTemplate) {
        if (selectedTemplate?.label === CUSTOM_TEMPLATE.label) {
          return (input: MultiStepInput) =>
            this.inputCustomTemplate(input, state);
        }
        if (selectedTemplate?.label !== NO_TEMPLATE.label) {
          state.template = selectedTemplate.label;
        }

        return (input: MultiStepInput) => this.inputScriptName(input, state);
      }
    } while (!selectedTemplate);
  }

  private asItem(template: JBangTemplate): QuickPickItem {
    return {
      label: template.label,
      detail: template.description,
    };
  }

  private async getTemplates(): Promise<JBangTemplate[]> {
    if (!this.templates) {
      this.templates = await listTemplates();
    }
    return this.templates;
  }

  private async inputCustomTemplate(
    input: MultiStepInput,
    state: Partial<ScriptGenState>
  ) {
    state.totalSteps = DEFAULT_TOTAL_STEPS + 1;
    state.template = await input.showInputBox({
      title: "Custom template",
      step: 2,
      totalSteps: state.totalSteps,
      value: state.template || "",
      prompt: "Enter a template name",
      validate: validateTemplateName,
    });

    return (input: MultiStepInput) => this.inputScriptName(input, state);
  }

  private async inputScriptName(
    input: MultiStepInput,
    state: Partial<ScriptGenState>
  ) {
    state.scriptName = await input.showInputBox({
      title: "Enter a script name",
      step: state.totalSteps! - 1,
      totalSteps: state.totalSteps,
      value: state.scriptName || "",
      prompt: "Enter a script name",
      validate: validateName,
    });
  }
}
const supportedExtensions = [".java", ".kt", ".groovy", ".md"];
async function validateName(name: string): Promise<string | undefined> {
  if (!name) {
    return "Script name is required";
  }
  if (name.includes(" ")) {
    return "Script name cannot contain spaces";
  }
  //Check if name ends with a supported extension
  if (!supportedExtensions.some((ext) => name.endsWith(ext))) {
    return (
      "Script name must end with a supported extension:" +
      supportedExtensions.join(", ")
    );
  }
  return undefined;
}

async function validateTemplateName(name: string): Promise<string | undefined> {
  if (!name) {
    return "Template name is required";
  }
  if (name.includes(" ")) {
    return "Template name cannot contain spaces";
  }
  return undefined;
}

async function getTargetDirectory(fileName: string) {
  const MESSAGE_EXISTING_FILE = `'${fileName}' already exists in selected directory.`;
  const LABEL_CHOOSE_FOLDER = "Generate Here";
  const OPTION_OVERWRITE = "Overwrite";
  const OPTION_CHOOSE_NEW_DIR = "Choose new directory";

  const defaultDirectoryUri = workspace.workspaceFolders
    ? workspace.workspaceFolders[0].uri
    : undefined;

  let directory: Uri | undefined;
  if (defaultDirectoryUri) {
    const defaultDirectory = defaultDirectoryUri.fsPath;
    const files = fs.readdirSync(defaultDirectory);
    //Check if defaultDirectoryUri, ask the user where they want to generate the script
    if (files.length > 0) {
      directory = await showOpenFolderDialog({
        openLabel: LABEL_CHOOSE_FOLDER,
        defaultUri: defaultDirectoryUri,
      });
    } else {
      directory = defaultDirectoryUri;
    }
  }
  if (!directory) {
    directory = await showOpenFolderDialog({ openLabel: LABEL_CHOOSE_FOLDER });
  }

  while (directory && fs.existsSync(path.join(directory.fsPath, fileName))) {
    const overrideChoice = await window.showWarningMessage(
      MESSAGE_EXISTING_FILE,
      OPTION_OVERWRITE,
      OPTION_CHOOSE_NEW_DIR
    );
    if (overrideChoice === OPTION_CHOOSE_NEW_DIR) {
      directory = await showOpenFolderDialog({
        openLabel: LABEL_CHOOSE_FOLDER,
        defaultUri: defaultDirectoryUri,
      });
    } else if (overrideChoice === OPTION_OVERWRITE) {
      break;
    } else {
      // User closed the warning window
      directory = undefined;
      break;
    }
  }
  return directory;
}

async function showOpenFolderDialog(
  customOptions: OpenDialogOptions
): Promise<Uri | undefined> {
  const options: OpenDialogOptions = {
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  };

  const result = await window.showOpenDialog(
    Object.assign(options, customOptions)
  );
  if (result && result.length) {
    return Promise.resolve(result[0]);
  } else {
    return Promise.resolve(undefined);
  }
}
