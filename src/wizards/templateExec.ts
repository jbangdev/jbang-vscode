import * as fs from "fs";
import { jbang } from "../JBangExec";
import { executeCommand } from "../utils/cpUtils";
import { JBangTemplate } from "./JBangTemplate";
import { ScriptGenState } from "./wizardState";

export async function listTemplates(): Promise<JBangTemplate[]> {
  const data = await executeCommand(jbang(), ["template", "list"], {
    shell: true,
    env: {
      ...process.env,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      NO_COLOR: "true",
    },
  });
  let templates: JBangTemplate[] = [];
  const lines = data.toString().split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.indexOf("=") > 0) {
      const template = line.split("=");
      templates.push({
        label: template[0],
        description: template[1],
      });
    }
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
