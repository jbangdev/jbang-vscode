import * as fs from "fs";
import { jbang } from "../JBangExec";
import { executeCommand } from "../utils/cpUtils";
import { JBangTemplate } from "./JBangTemplate";
import { ScriptGenState } from "./wizardState";

export async function listTemplates(): Promise<JBangTemplate[]> {
  const data = await executeCommand(
    jbang(),
    ["template", "list", "--format=json"],
    {
      shell: true,
      env: {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        NO_COLOR: "true",
      },
    }
  );

  let templates: JBangTemplate[] = [];
  try {
    const jsonOutput = JSON.parse(data.toString());
    templates = jsonOutput.map(
      (template: { name: string; description: string }) => ({
        label: template.name,
        description: template.description,
      })
    );
  } catch (error) {
    console.error("Failed to parse template list JSON:", error);
  }

  return templates;
}

export async function generateScript(
  scriptGenState: ScriptGenState
): Promise<string[]> {
  const filesBefore = listFiles(scriptGenState.targetDir.fsPath);
  await executeCommand(jbang(), generateArgs(scriptGenState), {
    shell: true,
    cwd: scriptGenState.targetDir.fsPath,
  });
  const filesAfter = listFiles(scriptGenState.targetDir.fsPath);
  const newFiles = filesAfter.filter((file) => !filesBefore.includes(file));
  return newFiles;
}

function listFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((item) => !item.isDirectory())
    .map((item) => item.name);
}

function generateArgs(scriptGenState: ScriptGenState): string[] {
  const args = ["init"];
  if (scriptGenState.template) {
    args.push("-t");
    args.push(scriptGenState.template);
  }
  args.push("--force");
  args.push(scriptGenState.scriptName);
  return args;
}
