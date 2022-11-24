[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/jbangdev.jbang-vscode?style=for-the-badge&label=VS%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=jbangdev.jbang-vscode)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/jbangdev.jbang-vscode?style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=jbangdev.jbang-vscode)
[![Build Status](https://img.shields.io/github/workflow/status/jbangdev/jbang-vscode/Build/main?style=for-the-badge)](https://github.com/jbangdev/jbang-vscode/actions?query=branch%3Amain)
[![License](https://img.shields.io/github/license/jbangdev/jbang-vscode?style=for-the-badge)](https://github.com/jbangdev/jbang-vscode/blob/main/LICENSE)

# JBang for Visual Studio Code
This is an early work-in-progress extension for [vscode-java](https://marketplace.visualstudio.com/items?itemName=redhat.java). It aims at providing support for the [JBang](https://www.jbang.dev/) scripts written in Java (and partial support for Kotlin and Groovy).

**Pre-requisites:**
- [JBang](https://www.jbang.dev/download/) is installed and available in the PATH. Alternatively, you can set the `jbang.home` preference to point to a `JBang` installation
- [vscode-java](https://marketplace.visualstudio.com/items?itemName=redhat.java) is installed.

**Outstanding issues**:
- Modifications to build.jbang files don't trigger autosynchronization nor do they report diagnostics. See [jbang-eclipse#25](https://github.com/jbangdev/jbang-eclipse/issues/25).
- The Java Runtime for current file is not displayed in the status bar. See [vscode-java#2552](https://github.com/redhat-developer/vscode-java/issues/2552).

## Features
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
- Automagically configures JBang-managed JDKs, i.e. no need to configure `java.configuration.runtimes`.
- Partial support for Kotlin and Groovy scripts: completion for directive and run command are available, but no classpath management when editing the files.

## Preferences
- `jbang.home`: Specifies the folder path to the JBang directory (not the executable), eg. `~/.sdkman/candidates/jbang/current`. On Windows, backslashes must be escaped, eg `C:\\ProgramData\\chocolatey\\lib\\jbang`. Used by the `JBang: Create a new script` wizard and the `Run JBang` code lens. Useful in case `jbang` is not automatically picked up from the $PATH, for some reason.
- `jbang.wizard.templates.showDescriptions` : When set to `true` (the default), shows JBang template descriptions in the `JBang: Create a new script` wizard, else hides them.
- `java.import.jbang.projectPerScript` : When set to `true`, each script found in the opened folder will be imported as its own project, with its own classpath. `false` by default. Toggling this setting requires calling the `Java: Clean Java Language Server Workspace` command to take effect.

## Installation:
Continuous Integration builds can be installed from the Visual Studio Marketplace, as Pre-release builds. Alternatively, you can head to [https://github.com/jbangdev/jbang-vscode/releases/tag/latest](https://github.com/jbangdev/jbang-vscode/releases/tag/latest), download the most recent `jbang-vscode-<version>.vsix` file and install it by following the instructions [here](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix).

## Development Setup

### Prerequisites

  * [Visual Studio Code](https://code.visualstudio.com/) or compatible editors
  * [Language Support for Java](https://marketplace.visualstudio.com/items?itemName=redhat.java)
  * [Node.js 14+](https://nodejs.org/en/)
  * [JDK 17+](https://adoptium.net/en-GB/temurin/releases/)

### Setup
**Step 1.** Fork and clone this repository  

**Step 2.** Fork and clone the [jbangdev/jbang-eclipse repository](https://github.com/jbangdev/jbang-eclipse), which contains the JBang/Eclipse core plugin and its jdt.ls extension

**Note:** Ensure that the cloned repositories are under the same parent directory:

```
YOUR_FOLDER/
         ├──── jbang-vscode/
         ├──── jbang-eclipse/
```  
**Step 3.** Navigate into `jbang-vscode/`
```bash
$ cd jbang-vscode/
```  
**Step 4.** Install npm dependencies
```bash
$ npm ci
```  

**Step 5.** Build the JBang/Eclipse integration plugin and its jdt.ls extension
```bash
$ npm run build-ext
```

This script places the built jars in `jbang-vscode/jars/`.  

**Step 6.** Build the VS Code extension
```bash
$ npx vsce package
```
This will generate a `jbang-vscode-<version>.vsix` file in the `jbang-vscode/` directory.