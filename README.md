# vscode-jbang
This is a work-in-progress extension for [vscode-java](https://marketplace.visualstudio.com/items?itemName=redhat.java). It aims at providing support for the JBang scripts written in Java.

**It is currently not working as intended.**

**Outstanding issues**:
- The validation doesn't work correctly when opening a JBang file the 1st time. One needs to make some dummy changes in the JBang instructions of the file to make it work (eg. change //DEPS or //JAVA version), or just reload VS Code.
- JBang validation errors are not propagated by Eclipse jdt.ls, so you will miss dependency errors (eg. //DEPS wrong:dep:version).
- The Java Runtime for current file is not displayed in the status bar.
- The JBang Classpath container is not shown in the Java Projects view (contributed by [Project Manager for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-dependency)).

**What you can do**:
If you open a folder containing JBang scripts, each script will be assigned a specific classpath.

## Development Setup

### Prerequisites

  * [Visual Studio Code](https://code.visualstudio.com/)
  * [Language Support for Java](https://marketplace.visualstudio.com/items?itemName=redhat.java)
  * [Node.js 14+](https://nodejs.org/en/)
  * [JDK 11+](https://adoptopenjdk.net/)

### Setup
**Step 1.** Fork and clone this repository  

**Step 2.** Fork and clone the [lsp](https://github.com/fbricon/jbang-eclipse/tree/lsp) branch of the [fbricon/jbang-eclipse repository](https://github.com/fbricon/jbang-eclipse), which contains the JBang/Eclipse core plugin and its jdt.ls extension

**Note:** Ensure that the cloned repositories are under the same parent directory:

```
YOUR_FOLDER/
         ├──── vscode-jbang/
         ├──── jbang-eclipse/
```  
**Step 3.** Navigate into `vscode-jbang/`
```bash
$ cd vscode-jbang/
```  
**Step 4.** Install npm dependencies
```bash
$ npm ci
```  

**Step 5.** Build the JBang/Eclipse integration plugin and its jdt.ls extension
```bash
$ npm run build-ext
```

This script places the built jars in `vscode-jbang/jars/`.  

**Step 6.** Build the VS Code extension
```bash
$ npx vsce package
```
This will generate a `vscode-jbang-<version>.vsix` file in the `vscode-jbang/` directory.