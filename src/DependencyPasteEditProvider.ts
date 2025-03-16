import { XMLParser } from "fast-xml-parser";
import {
  CancellationToken,
  DataTransfer,
  DocumentDropOrPasteEditKind,
  DocumentPasteEdit,
  DocumentPasteEditContext,
  DocumentPasteEditProvider,
  DocumentSelector,
  ExtensionContext,
  languages,
  Range,
  TextDocument,
} from "vscode";
import { isJBangFile, SUPPORTED_LANGUAGES } from "./JBangUtils";

const TEXT_MIMETYPE: string = "text/plain";
const DEPS_PREFIX = "//DEPS";
const XML_DEPENDENCY_TAGS = [
  "<dependency>",
  "<dependencies>",
  "<dependencyManagement>",
];

interface MavenDependency {
  groupId: string;
  artifactId: string;
  version?: string;
  type?: string;
}

class DependencyPasteEditProvider implements DocumentPasteEditProvider {
  async provideDocumentPasteEdits(
    document: TextDocument,
    ranges: readonly Range[],
    dataTransfer: DataTransfer,
    context: DocumentPasteEditContext,
    token: CancellationToken
  ): Promise<DocumentPasteEdit[] | null | undefined> {
    if (!isJBangFile(document.getText())) {
      return undefined;
    }
    const pastedText = await this.getPasteContent(dataTransfer);
    if (!pastedText) {
      return undefined;
    }

    // don't try to provide for multi character inserts; the implementation will get messy and the feature won't be that helpful
    if (!pastedText || token.isCancellationRequested || ranges.length !== 1) {
      return undefined;
    }

    const line = ranges[0].start.line;
    const targetLine = document.lineAt(line).text.trimEnd();
    //Only paste on the 1st column, or if the line is a prefix of //DEPS
    if (targetLine.length > 0 && !DEPS_PREFIX.startsWith(targetLine)) {
      return undefined;
    }

    const xmlDependencies = this.parseDependencies(pastedText);
    if (!xmlDependencies) {
      return undefined;
    }
    let jbangDependencies = this.convertDependencies(xmlDependencies);
    if (!jbangDependencies) {
      return undefined;
    }

    //if convertedDependencies starts with the same characters as the current line, remove the duplicate characters
    if (jbangDependencies.startsWith(targetLine)) {
      jbangDependencies = jbangDependencies.substring(targetLine.length);
    }
    return [
      new DocumentPasteEdit(
        jbangDependencies,
        "Paste as JBang //DEPS",
        DependencyPasteEditProvider.kind
      ),
    ];
  }

  private async getPasteContent(
    dataTransfer: DataTransfer
  ): Promise<string | undefined> {
    const pasteContent = dataTransfer.get(TEXT_MIMETYPE);
    return pasteContent ? (await pasteContent.asString()).trim() : undefined;
  }

  private parseDependencies(
    pastedText: string
  ): MavenDependency | MavenDependency[] | undefined {
    if (!XML_DEPENDENCY_TAGS.some((tag) => pastedText.startsWith(tag))) {
      return undefined;
    }

    const xml = new XMLParser().parse(pastedText);
    return (
      xml.dependency ||
      xml.dependencies?.dependency ||
      xml.dependencyManagement?.dependencies?.dependency
    );
  }

  private convertDependencies(
    dependencies: MavenDependency | MavenDependency[]
  ): string | undefined {
    if (Array.isArray(dependencies)) {
      const deps = dependencies
        .map((d) => this.toJBangDependency(d))
        .filter(Boolean);
      return deps.length ? deps.join("\n") : undefined;
    }
    return this.toJBangDependency(dependencies);
  }

  private toJBangDependency(dependency: MavenDependency): string | undefined {
    const { groupId, artifactId, version = "LATEST", type } = dependency;
    if (!groupId || !artifactId) {
      return undefined;
    }
    const suffix = type === "pom" ? "@pom" : "";
    return `${DEPS_PREFIX} ${groupId}:${artifactId}:${version}${suffix}`;
  }

  /**
   * Registers the DependencyPasteEditProvider and sets it up to be disposed.
   *
   * @param context the extension context
   */
  static readonly kind = DocumentDropOrPasteEditKind.Empty.append(
    "jbang",
    "dependency"
  );

  public initialize(context: ExtensionContext) {
    if (languages.registerDocumentPasteEditProvider) {
      const dependencyPasteEditProvider = new DependencyPasteEditProvider();
      const selector: DocumentSelector = SUPPORTED_LANGUAGES.map(
        (language) => ({ language })
      );
      context.subscriptions.push(
        languages.registerDocumentPasteEditProvider(
          selector,
          dependencyPasteEditProvider,
          {
            providedPasteEditKinds: [DependencyPasteEditProvider.kind],
            pasteMimeTypes: [TEXT_MIMETYPE],
          }
        )
      );
    }
  }
}

export default new DependencyPasteEditProvider();
