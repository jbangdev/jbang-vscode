# Change Log

All notable changes to the **JBang** extension will be documented in this file.

## [0.12.0] 17/03/2025
- Added support for pasting Maven XML dependency snippets as JBang `//DEPS` (requires VS Code 1.97+)
- Added Quarkus'`Q:CONFIG` syntax highlighting and completion
- Added support for codelenses on instance main method
- Added documentation on hover over JBang directives
- Fixed Java value validation in JBang catalogs
- Replaced axios with fetch for http requests
- Updated various dependencies

## [0.11.0]  26/02/2024
- Added textmate grammar for JBang directives
- Fixed error reporting for unresolved dependencies
- Updated various dependencies

## [0.10.0]  08/12/2023
- Added `//Q:CONFIG` completion if `//DEPS io.quarkus:quarkus` is found
- Fixed running JBang installed via scoop on Windows
- Fixed bad looking documentation on hover on `//DEPS`
- Updated various dependencies

## [0.9.0]  25/09/2023
- Automatically save document after selecting a result in `//DEPS` completion
- Save document before running/debugging with JBang
- Added `//JAVA 21` completion
- Added `--enable-http` and `--enable-https` completions for `//NATIVE_OPTIONS` directive
- Built with Node 18

## [0.8.0]  17/09/2023
- Added code action to find dependency for missing class, on Maven Central
- Added completion for local `//DEPS` (requires JBang 0.109.0+)
- Fixed running JBang commands from the command palette
- Fixed apply dependency change on original file uri, not active editor
- Bundle the extension with esbuild

## [0.7.0]  23/06/2023
- Update JBang catalog schema (from jbang-idea)
- Added completion for `//PREVIEW` (requires JBang 0.108.0+)


## [0.6.0]  24/02/2023
- Added autocompletion for [`jbang-catalog.json`](https://www.jbang.dev/documentation/guide/latest/alias_catalogs.html) files.
- Added completion for `//MODULE` and `//MAIN` directives (requires JBang 0.104.0+)
- Added JBang debug icon
- Fixed hover failing over LATEST versions
- Allowed completion for several `//DESCRIPTION` directives

## [0.5.0]  18/01/2023
- Automatic source download when using JBang 0.102.0+
- Added completion for `//FILES`
- Display error markers when `//FILES` or `//SOURCES` are invalid
- Fixed JBang failing if `JAVA_HOME` is set to an invalid location
- Added 5s request timeout when searching for dependencies on Maven Central

## [0.4.2]  06/01/2023
- Display `Run JBang` menu on `jar` files
- Fixed JBang header completion
- Fixed NPE on import

## [0.4.1]  03/01/2023
- Ignore Java's `Picked up JAVA_TOOL_OPTIONS` message that broke Gitpod integration

## [0.4.0]  03/01/2023
- Add completion for `//NATIVE_OPTIONS`, `//COMPILE_OPTIONS`, `//RUNTIME_OPTIONS`, `//GROOVY`, `//KOTLIN`
- Display `Run JBang` command in quick run menu
- Report invalid `//JAVA` version at the proper location
- Configure project according to `--release` or `-source` value
- Provide dependency completion for Kotlin and Groovy files
- Display `Run JBang` codelens for Kotlin and Groovy files
- Display `Debug JBang` codelens for Java files
- Add new `JBang: install application` command
- Fixed script detection in nested folders
- Fixed Chocolatey's JBang support

## [0.3.0]  29/10/2022
- Automagically configures JBang-managed JDKs, i.e. no need to configure `java.configuration.runtimes`.
- fix: completion after groupid:| didn't work

## [0.2.0]

- If you open a folder containing JBang scripts, the first JBang script found will be used to configure a "Project"'s classpath. When configuring the `java.import.jbang.projectPerScript` setting to `true`, each script in the folder will be assigned a specific classpath. Toggling this setting requires calling the `Java: Clean Java Language Server Workspace` command to take effect.
- Modifying JBang directives in a file will update the classpath of the file.
- Snippets are provided for JBang directives.
- Autocompletion for dependencies in `//DEPS`
- Autocompletion for `//SOURCES`
- Partial autocompletion for `//JAVA_OPTIONS` and `//JAVAC_OPTIONS`
- Display dependency documentation on completion/hover
- JBang scripts can be run from the `Run JBang` codelens, that shows on top of the type declaration or main method, if there is one.
- If a (.java) script is included in a Maven or Gradle project's hierarchy, right-clicking on the script and selecting `JBang > Synchronize JBang` will add the script's parent folder to the project's source path and the JBang dependencies will be added to the project's classpath.
- Create a new JBang script from an existing template with the `JBang: Create a new script` command.
- Annotation processors are automatically detected and configured.
- Partial support for `build.jbang` files: If a folder containing `build.jbang` is opened, it'll be used to configure the Java settings of its //SOURCES. Currently, changes in `build.jbang` require manually triggering the `JBang > Synchronize JBang` command (via codelens or context menu) to take effect.
- Export the script as a native binary, by right-clicking on the script and selecting the `JBang > Export as native binary` menu. This requires GraalVM to be installed with the native-image extension. See https://www.jbang.dev/documentation/guide/latest/usage.html#build-and-run-native-image-experimental
