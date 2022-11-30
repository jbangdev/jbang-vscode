# Change Log

All notable changes to the **JBang** extension will be documented in this file.

## [0.4.0]  TBD
- Add completion for `//NATIVE_OPTIONS`, `//COMPILE_OPTIONS`, `//RUNTIME_OPTIONS`, `//GROOVY`, `//KOTLIN`
- Report invalid `//JAVA` version at the proper location
- Configure project according to `--release` or `-source` value
- Provide dependency completion for Kotlin and Groovy files
- Display `Run JBang` codelens for Kotlin and Groovy files

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
