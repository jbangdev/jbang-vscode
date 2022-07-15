import * as fs from "fs";
import { OpenDialogOptions, Uri, window, workspace } from "vscode";
import { MultiStepInput } from "./multiStepsUtils";
import { generateScript, getTemplates } from "./templateExec";
import { ScriptGenState } from "./wizardState";
import path = require("path");

export default class JBangScriptWizard {

    constructor() { }

    public static async open() {
        const wizard = new JBangScriptWizard();
        await wizard.run();
    }

    private async run() {
        const state: Partial<ScriptGenState> = {
            totalSteps: 3,
        };
        await MultiStepInput.run(input => this.inputTemplate(input, state));
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
                window.showTextDocument(Uri.file(scriptPath));
            }
        } catch (e: any) {
            window.showErrorMessage(e.message);
        }
    }

    private async inputTemplate(input: MultiStepInput, state: Partial<ScriptGenState>) {
        const templates = await getTemplates();
        const template = await input.showQuickPick({
            title: "Select a template",
            step: 1,
            totalSteps: state.totalSteps,
            items: templates,
            placeholder: "Select a template",
        });
        if (template) {
            state.template = template.label;
        }

        return (input: MultiStepInput) => this.inputScriptName(input, state);
    }

    private async inputScriptName(input: MultiStepInput, state: Partial<ScriptGenState>) {
        state.scriptName = await input.showInputBox({
            title: "Enter a script name",
            step: 2,
            totalSteps: state.totalSteps,
            value: state.scriptName || "",
            prompt: "Enter a script name",
            validate: validateName
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
    if (!supportedExtensions.some(ext => name.endsWith(ext))) {
        return "Script name must end with a supported extension:" + supportedExtensions.join(", ");
    }
    return undefined;
}

async function getTargetDirectory(fileName: string) {
    const MESSAGE_EXISTING_FILE = `'${fileName}' already exists in selected directory.`;
    const LABEL_CHOOSE_FOLDER = 'Generate Here';
    const OPTION_OVERWRITE = 'Overwrite';
    const OPTION_CHOOSE_NEW_DIR = 'Choose new directory';

    const defaultDirectoryUri = workspace.workspaceFolders ? workspace.workspaceFolders[0].uri : undefined;
    
    let directory = await showOpenFolderDialog({ openLabel: LABEL_CHOOSE_FOLDER, defaultUri: defaultDirectoryUri });

    while (directory && fs.existsSync(path.join(directory.fsPath, fileName))) {
        const overrideChoice = await window.showWarningMessage(MESSAGE_EXISTING_FILE, OPTION_OVERWRITE, OPTION_CHOOSE_NEW_DIR);
        if (overrideChoice === OPTION_CHOOSE_NEW_DIR) {
            directory = await showOpenFolderDialog({ openLabel: LABEL_CHOOSE_FOLDER, defaultUri: defaultDirectoryUri });
        } else if (overrideChoice === OPTION_OVERWRITE) {
            break;
        } else { // User closed the warning window
            directory = undefined;
            break;
        }
    }
    return directory;
}

async function showOpenFolderDialog(customOptions: OpenDialogOptions): Promise<Uri | undefined> {
    const options: OpenDialogOptions = {
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
    };

    const result = await window.showOpenDialog(Object.assign(options, customOptions));
    if (result && result.length) {
        return Promise.resolve(result[0]);
    } else {
        return Promise.resolve(undefined);
    }
}