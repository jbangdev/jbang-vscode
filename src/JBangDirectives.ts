export class Directive {
  constructor(public name:string, public description: string, public reTriggerCompletion = false, public multipleAllowed = true){}

  matches(line: string, includeSpace:boolean = false): boolean {
    const pfix = this.prefix() + (includeSpace?" ":"");
    return line.startsWith(pfix);
  }

  prefix() {
    return `//${this.name}`;
  }

}

export const JAVA = new Directive("JAVA", "Java version to use when running JBang", true);

export const DEPS = new Directive("DEPS", "JBang dependencies");
export const JAVAC_OPTIONS = new Directive("JAVAC_OPTIONS","Options passed to the Java compiler", true);
export const JAVA_OPTIONS = new Directive("JAVA_OPTIONS","Options passed to the Java runtime", true);
export const COMPILE_OPTIONS = new Directive("COMPILE_OPTIONS","Options passed to the compiler", true);
export const RUNTIME_OPTIONS = new Directive("RUNTIME_OPTIONS", "Options passed to the JVM runtime", true);
export const NATIVE_OPTIONS = new Directive("NATIVE_OPTIONS","Options passed to the native image builder", true);
export const MANIFEST = new Directive("MANIFEST","Write entries to META-INF/manifest.mf");
export const CDS = new Directive("CDS","Activate Class Data Sharing");
export const GAV = new Directive("GAV","Set Group, Artifact and Version", false);
export const DESCRIPTION = new Directive("DESCRIPTION","Markdown description for the JBang application/script");
export const JAVAAGENT = new Directive("JAVAAGENT","Activate agent packaging");
export const GROOVY = new Directive("GROOVY","Groovy version to use", true);
export const KOTLIN = new Directive("KOTLIN","Kotlin version to use", true);
export const MODULE = new Directive("MODULE","Treat resource as a module. Optionally with the given module name.");
export const MAIN = new Directive("MAIN","Override the main class", false);
export const PREVIEW = new Directive("PREVIEW","Enable Java preview features", false);
export const SOURCES = new Directive("SOURCES", "Pattern to include as JBang sources", true);
export const FILES = new Directive("FILES", "Mount files to build", true);
export const REPOS = new Directive("REPOS", "Repositories used by Jbang to resolve dependencies");
export const QUARKUS_CONFIG = new Directive("Q:CONFIG ", "Quarkus configuration property");

//Special case
export const FILES_PREFIX = `${FILES.prefix()} `;
export const HEADER_PREFIX = "///usr/bin/env jbang ";
export const HEADER = new Directive(`${HEADER_PREFIX}"$0" "$@" ; exit $?`,"JBang header"); //Not really a directive, but hey

export const JBANG_DIRECTIVES = [
  JAVA,
  DEPS,
  JAVAC_OPTIONS,
  JAVA_OPTIONS,
  RUNTIME_OPTIONS,
  COMPILE_OPTIONS,
  NATIVE_OPTIONS,
  CDS,
  DESCRIPTION,
  GAV,
  GROOVY,
  KOTLIN,
  JAVAAGENT,
  MAIN,
  MANIFEST,
  MODULE,
  PREVIEW,
  SOURCES,
  FILES,
  REPOS,
  QUARKUS_CONFIG
];