// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as cp from "child_process";

export async function executeCommand(command: string, args: string[], options: cp.SpawnOptions = { shell: true }): Promise<string> {
    return new Promise((resolve: (res: string) => void, reject: (e: Error) => void): void => {
        let result: string = "";
        let error: string = "";
        const childProc: cp.ChildProcess = cp.spawn(command, args, options);
        if (childProc.stdout) {
            childProc.stdout.on("data", (data: string | Buffer) => {
                data = data.toString();
                console.log(data);
                result = result.concat(data);
            });
        }
        if (childProc.stderr) {
            childProc.stderr.on("data", (data: string | Buffer) => {
                data = data.toString();
                console.error(data);
                error = error.concat(data);
            });
        }
        childProc.on("error", (err) =>{
            if (error) {
                reject(new Error(error));
            } else {
                reject(err);
            }
        });
        childProc.on("close", (code: number) => {
            if (code !== 0 || result.indexOf("ERROR") > -1) {
                let msg = `Command "${command} ${args.join(" ")}" failed`;
                if (error) {
                    msg = msg.concat(`:\n ${error}`);
                }
                reject(new Error(msg));
            } else {
                resolve(result);
            }
        });
    });
}