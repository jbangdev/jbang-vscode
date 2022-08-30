import path = require('path');
import * as os from 'os';
import { workspace, WorkspaceConfiguration } from 'vscode';
import { JBangConfig } from './JBangConfig';

function isWin():boolean {
    return /^win/.test(process.platform);
}

export function jbang():string {
    let home = JBangConfig.getJBangHome();
    let dir = "";
    if (home) {
        if (home.startsWith('~')) {
            home = path.resolve(os.homedir() , home.substring(2, home.length));
        }
        dir = path.resolve(home, 'bin');
    }
    const jbangExec = (isWin()?"jbang.cmd":"jbang");
    const fullPath = path.resolve(dir, jbangExec);
    console.log("Using JBang from "+fullPath);
    return fullPath;
}

export function getJBangConfiguration(): WorkspaceConfiguration {
	return workspace.getConfiguration('jbang');
}