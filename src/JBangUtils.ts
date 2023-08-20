export const SUPPORTED_LANGUAGES = ["java", "groovy", "kotlin", "jshell", "jbang"];

export function isJBangFile(content: string | string[]): boolean {
    let lines:string[] = [];
    if (typeof content === 'string' || content instanceof String) {
        lines = content.split(/\r?\n/);
    } else {
        lines = content as string[]; 
    }
    return lines.find(isJBangDirective) !== undefined; 
}

export const DEPS_PREFIX = "//DEPS ";

const KNOWN_DIRECTIVES = ["///usr/bin/env jbang ", DEPS_PREFIX, "//JAVA ", "//GAV ", "//FILES ", "//SOURCES ", "//DESCRIPTION ", "//REPOS ", "//JAVAC_OPTIONS ", "//JAVA_OPTIONS ", "//JAVAAGENT ", "//CDS ", "//KOTLIN ", "//GROOVY ", "//MANIFEST", "//RUNTIME_OPTIONS", "//COMPILE_OPTIONS", "//NATIVE_OPTIONS"];

export function isJBangDirective(line: string): boolean {
    //TODO: detect @Grab/@Grape 
    return KNOWN_DIRECTIVES.find(directive => {
        return line.startsWith(directive);
    }) !== undefined;
}