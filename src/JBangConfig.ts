import { ConfigurationTarget, workspace, WorkspaceConfiguration } from "vscode";

export namespace JBangConfig {

    export const SHOW_TEMPLATE_DESC = 'wizard.templates.showDescriptions';
    export const HOME = 'home';

    export function isShowTemplateDescriptions(): boolean {
        return getJBangConfiguration().get<boolean>(SHOW_TEMPLATE_DESC, true);
    }

    export function getJBangHome(): string|undefined {
        return (getJBangConfiguration().get(HOME) as string|undefined)?.trim();
    }

    export function getJBangConfiguration(): WorkspaceConfiguration {
        return workspace.getConfiguration('jbang');
    }

    export function setShowTemplateDescriptions(value: boolean): Thenable<void> {
        return setJBangConfig(SHOW_TEMPLATE_DESC, value);
    }

    export function setJBangConfig<T>(configName: string, value: T): Thenable<void> {
        const info =  getJBangConfiguration().inspect(configName);
        let scope = ConfigurationTarget.Global;
        if (info?.workspaceValue !== undefined) {
            scope = ConfigurationTarget.Workspace
        } else if (info?.workspaceFolderValue !== undefined) {
            scope = ConfigurationTarget.WorkspaceFolder;
        }
        return getJBangConfiguration().update(configName, value, scope);
    }
}  
  