import { PathLike } from "fs";
import * as fs from "fs/promises";

export async function existsAsync(path: PathLike): Promise<boolean> {
    return !!fs.lstat(path).catch(e => false);
}