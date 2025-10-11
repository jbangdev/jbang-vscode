import {
  commands,
  ConfigurationTarget,
  ExtensionContext,
  window,
  workspace,
  WorkspaceConfiguration,
} from "vscode";

export namespace JBangSettings {
  export const SAVE_ON_SELECT_COMPLETION = "completion.onSelect.autosave";
  export const HOME = "home";
}

export class JBangConfig {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  static CLEAN_WORKSPACE = "java.clean.workspace";

  oldJavaConfig: WorkspaceConfiguration = this.getJavaConfiguration();

  initialize(context: ExtensionContext) {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration((params) => {
        if (!params.affectsConfiguration("java")) {
          return;
        }
        const newJavaConfig = this.getJavaConfiguration();
        if (
          hasConfigKeyChanged(
            "import.jbang.projectPerScript",
            this.oldJavaConfig,
            newJavaConfig
          )
        ) {
          const msg = `JBang import startegy changed, you need to clean the workspace for it to take effect.`;
          const action = "Clean Java Workspace";
          const restartId = JBangConfig.CLEAN_WORKSPACE;
          window.showWarningMessage(msg, action).then((selection) => {
            if (action === selection) {
              commands.executeCommand(restartId);
            }
          });
        }
        this.oldJavaConfig = newJavaConfig;
      })
    );
  }

  public isSaveOnSelectEnabled(): boolean {
    return this.getJBangConfiguration().get<boolean>(
      JBangSettings.SAVE_ON_SELECT_COMPLETION,
      true
    );
  }

  public getJBangHome(): string | undefined {
    return (
      this.getJBangConfiguration().get(JBangSettings.HOME) as string | undefined
    )?.trim();
  }

  public getJBangConfiguration(): WorkspaceConfiguration {
    return workspace.getConfiguration("jbang");
  }

  public getJavaConfiguration(): WorkspaceConfiguration {
    return workspace.getConfiguration("java");
  }

  public setJBangConfig<T>(configName: string, value: T): Thenable<void> {
    const info = this.getJBangConfiguration().inspect(configName);
    let scope = ConfigurationTarget.Global;
    if (info?.workspaceValue !== undefined) {
      scope = ConfigurationTarget.Workspace;
    } else if (info?.workspaceFolderValue !== undefined) {
      scope = ConfigurationTarget.WorkspaceFolder;
    }
    return this.getJBangConfiguration().update(configName, value, scope);
  }
}

function hasConfigKeyChanged(
  key: string,
  oldConfig: WorkspaceConfiguration,
  newConfig: WorkspaceConfiguration
): boolean {
  return oldConfig.get(key) !== newConfig.get(key);
}

export default new JBangConfig();
