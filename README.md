# JBang for Visual Studio Code
This is an early work-in-progress extension for [vscode-java](https://marketplace.visualstudio.com/items?itemName=redhat.java). It aims at providing support for the [JBang](https://www.jbang.dev/) scripts written in Java.

**Pre-requisites:**
- [JBang](https://www.jbang.dev/download/) is installed and available in the PATH.
- [vscode-java](https://marketplace.visualstudio.com/items?itemName=redhat.java) is installed.

**Outstanding issues**:
- JBang validation errors are not propagated by Eclipse jdt.ls, so you will miss dependency errors (eg. //DEPS wrong:dep:version). See ~~[eclipse.jdt.ls#2154](https://github.com/eclipse/eclipse.jdt.ls/issues/2154)~~. This is fixed in the **pre-release** of vscode-java. 
- The Java Runtime for current file is not displayed in the status bar. See [vscode-java#2552](https://github.com/redhat-developer/vscode-java/issues/2552)
- The JBang Classpath container is not shown in the Java Projects view (contributed by [Project Manager for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-dependency)). See [vscode-java-dependency#654](https://github.com/microsoft/vscode-java-dependency/issues/654).

**What works (more or less)**:
- If you open a folder containing JBang scripts, each script will be assigned a specific classpath.
- Modifying JBang directives in a file will update the classpath of the file.
- JBang scripts can be run from the `Run JBang` codelens, that shows on top of the type declaration or main method, if there is one.
- If a (.java) script is included in a Maven or Gradle project's hierarchy, right-clicking on the script and selecting `Synchronize JBang` will add the script's parent folder to the project's source path and the JBang dependencies will be added to the project's classpath.
- Create a new JBang script from an existing template with the `JBang: Create a new script` command.
- Annotation processors are automatically detected and configured.

## Installation:
Continuous Integration builds can be installed from [https://github.com/jbangdev/jbang-vscode/releases/tag/latest](https://github.com/jbangdev/jbang-vscode/releases/tag/latest). Download the most recent `jbang-vscode-<version>.vsix` file and install it by following the instructions [here](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix).

## Development Setup

### Prerequisites

  * [Visual Studio Code](https://code.visualstudio.com/)
  * [Language Support for Java](https://marketplace.visualstudio.com/items?itemName=redhat.java)
  * [Node.js 14+](https://nodejs.org/en/)
  * [JDK 11+](https://adoptopenjdk.net/)

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