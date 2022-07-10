export function isJBangFile(content: string | string[]): boolean {
    let lines:string[] = [];
    if (content instanceof String) {
        lines = content.split(/\r?\n/);
    } else {
        lines = content as string[]; 
    }
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("//DEPS" || line.startsWith("//JAVA") || line.startsWith("///usr/bin/env jbang"))) {
            return true;
        }
    }
    return false;
}