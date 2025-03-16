import { PathLike } from "fs";
import * as fs from "fs/promises";
import { Uri, workspace } from "vscode";

export async function existsAsync(path: PathLike): Promise<boolean> {
  return !!fs.lstat(path).catch((e) => false);
}

export async function saveIfNeeded(uri: Uri): Promise<boolean> {
  const document = workspace.textDocuments.find((doc) => doc.uri === uri);
  if (document && document.isDirty) {
    return document.save();
  }
  return true;
}
