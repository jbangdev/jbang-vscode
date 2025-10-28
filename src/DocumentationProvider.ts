import { XMLParser } from "fast-xml-parser";
import * as fs from "fs/promises";
import { LRUCache } from "lru-cache";
import { MarkdownString } from "vscode";
import { CancellationToken } from "vscode-languageclient";
import {
  Dependency,
  getLocalFile,
  getRemoteMetadata,
  getRemoteRepositoriesFile,
  getRemoteUrl,
} from "./models/Dependency";
import { createFetchOptions } from "./utils/fetchUtils";

const cacheTTL = 1000 * 60 * 10; // 10 min
const DOC_CACHE = new LRUCache<string, MarkdownString>({
  max: 500,
  // for use with tracking overall storage size
  maxSize: 500,
  // how long to live in ms
  ttl: cacheTTL,
  sizeCalculation: (value: MarkdownString, key: string) => {
    return 1;
  },
  // return stale items before removing from cache?
  allowStale: false,
});

const LATEST_VERSIONS_CACHE = new LRUCache<string, string>({
  max: 20,
  // for use with tracking overall storage size
  maxSize: 20,
  // how long to live in ms
  ttl: cacheTTL,
  sizeCalculation: (value: string, key: string) => {
    return 1;
  },
  // return stale items before removing from cache?
  allowStale: false,
});

const NO_DOC = new MarkdownString("");

export class DocumentationProvider {
  public async getDocumentation(
    dependency: Dependency,
    _token: CancellationToken,
    repos?: Map<string, string>
  ): Promise<MarkdownString | undefined> {
    const gav = dependency.toString();
    if (DOC_CACHE.has(gav)) {
      return DOC_CACHE.get(gav);
    }
    let pom: any;
    try {
      pom = await this.loadPom(dependency);
    } catch (e: any) {
      console.error(e);
      if (e?.response?.status > 400) {
        DOC_CACHE.set(gav, NO_DOC);
        return NO_DOC;
      }
    }
    const name = pom?.project?.name
      ? pom.project.name
      : pom?.project?.artifactId
      ? pom.project.artifactId
      : dependency.artifactId;
    let description = `**${name}**`;
    if (pom?.project?.description) {
      description += `\n\n`;
      description += this.toMarkdown(pom?.project?.description);
    }

    // Add repository hyperlink if available
    const repoUrl = await this.getRepositoryUrl(dependency, repos);
    if (repoUrl) {
      description += `\n\n[View in Maven Repository](${repoUrl})`;
    }

    let doc: MarkdownString | undefined;
    if (description) {
      doc = new MarkdownString(description);
      if (repoUrl) {
        //Only cache once the dependency has been resolved
        DOC_CACHE.set(gav, doc);
      }
    }
    return doc;
  }

  private async loadPom(dependency: Dependency): Promise<any> {
    let realVersion = dependency.version;
    if (dependency.version === "LATEST") {
      realVersion = await findLatestVersion(dependency);
      if (!realVersion) {
        return undefined;
      }
    }
    const filePath = getLocalFile(
      dependency.groupId,
      dependency.artifactId,
      realVersion
    );
    if (!filePath) {
      return undefined;
    }
    let xml: string | undefined;
    try {
      xml = await fs.readFile(filePath, "utf8");
    } catch (error) {
      const pomUrl = getRemoteUrl(
        dependency.groupId,
        dependency.artifactId,
        realVersion
      );
      if (pomUrl) {
        xml = await fetchData(pomUrl);
        //TODO save xml locally to prevent future remote calls
      }
    }
    return parseXML(xml);
  }

  private async getRepositoryUrl(
    dependency: Dependency,
    repos?: Map<string, string>
  ): Promise<string | undefined> {
    if (!repos || repos.size === 0) {
      return undefined;
    }

    let realVersion = dependency.version;
    if (dependency.version === "LATEST") {
      realVersion = await findLatestVersion(dependency);
      if (!realVersion) {
        return undefined;
      }
    }

    if (!dependency.groupId || !dependency.artifactId || !realVersion) {
      return undefined;
    }

    // Try to read _remote.repositories file
    const remoteReposPath = getRemoteRepositoriesFile(
      dependency.groupId,
      dependency.artifactId,
      realVersion
    );

    if (!remoteReposPath) {
      return undefined;
    }

    try {
      const remoteReposContent = await fs.readFile(remoteReposPath, "utf8");
      const repoIds = this.extractRepositoryIds(
        remoteReposContent,
        dependency.artifactId,
        realVersion
      );

      // Find the first repository ID that exists in our repository map
      for (const repoId of repoIds) {
        if (repos.has(repoId)) {
          const repoUrl = repos.get(repoId)!;
          // Build the repository URL for the artifact
          let url: string;
          if (repoId === "jitpack") {
            url = this.buildJitPackUrl(repoUrl, dependency);
          } else {
            // Standard Maven repository structure
            const artifactPath = `${dependency.groupId?.replace(/\./g, "/")}/${
              dependency.artifactId
            }`;
            url = `${repoUrl.replace(/\/$/, "")}/${artifactPath}`;
          }
          return url;
        }
      }
    } catch (error) {
      // File doesn't exist or can't be read, that's ok
      console.debug(
        `Could not read _remote.repositories file: ${remoteReposPath}`
      );
    }

    return undefined;
  }

  private buildJitPackUrl(repoUrl: string, dependency: Dependency): string {
    const gitHostMappings: { [prefix: string]: string } = {
      "com.github.": "",
      "org.bitbucket.": "",
      "com.gitlab.": "",
      "com.gitee.": "",
      "com.azure.": "",
    };

    let gitPath = "";
    const groupId = dependency.groupId || "";

    // Find the first matching prefix and replace it
    for (const [prefix, replacement] of Object.entries(gitHostMappings)) {
      if (groupId.startsWith(prefix)) {
        gitPath = groupId.replace(prefix, replacement);
        break;
      }
    }

    // Fallback: use the last part of the groupId if no mapping found
    if (!gitPath) {
      gitPath = groupId.split(".").pop() || "";
    }

    return `${repoUrl}#${gitPath}/${dependency.artifactId}`;
  }

  private extractRepositoryIds(
    remoteReposContent: string,
    artifactId: string,
    version: string
  ): string[] {
    const repoIds = new Set<string>();
    const lines = remoteReposContent.split("\n");

    for (const line of lines) {
      if (
        line.includes(`${artifactId}-${version}.jar>`) ||
        line.includes(`${artifactId}-${version}.pom>`)
      ) {
        // Extract repository ID from line like: artifact-version.jar>repo-id=
        const match = line.match(/.*>([^=]+)=$/);
        if (match) {
          repoIds.add(match[1]);
        }
      }
    }

    return Array.from(repoIds);
  }

  private toMarkdown(xml?: string): string | undefined {
    if (!xml) {
      return undefined;
    }
    return this.minimizeIndentation(xml);
  }

  private minimizeIndentation(inputText: string): string {
    //Need to minimize indentation, or else the doc looks like crap
    //See https://github.com/stleary/JSON-java/blob/92991770ca9f5e12d687bd9f6147d10e8baedd2e/pom.xml#L10-L21

    // Split the input text into lines
    const lines = inputText.split("\n");
    const result = lines.map((l) => l.trim()).join("\n");
    return result;
  }
}

export default new DocumentationProvider();

async function fetchData(uri: string): Promise<string | undefined> {
  console.log(`Fetching ${uri}`);
  const response = await fetch(uri, createFetchOptions());
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.text();
}

async function findLatestVersion(
  dependency: Dependency
): Promise<string | undefined> {
  const key = dependency.groupId + ":" + dependency.artifactId;
  if (LATEST_VERSIONS_CACHE.has(key)) {
    return LATEST_VERSIONS_CACHE.get(key);
  }
  let xmlData;
  try {
    xmlData = await loadMetadata(dependency);
  } catch (e: any) {
    console.error(e);
  }
  let latestVersion: string | undefined;
  if (xmlData) {
    const xml = parseXML(xmlData);
    if (xml) {
      latestVersion = xml?.metadata?.versioning?.latest;
    }
  }
  if (!latestVersion) {
    latestVersion = "";
  }
  LATEST_VERSIONS_CACHE.set(key, latestVersion);
  return latestVersion;
}

async function loadMetadata(
  dependency: Dependency
): Promise<string | undefined> {
  const metadataUrl = getRemoteMetadata(
    dependency.groupId,
    dependency.artifactId
  );
  if (!metadataUrl) {
    return undefined;
  }
  return fetchData(metadataUrl);
}

function parseXML(xml?: string): any {
  if (xml) {
    try {
      const parser = new XMLParser();
      return parser.parse(xml);
    } catch (e) {
      console.error(`Failed to parse XML from\n${xml}`);
    }
  }
  return undefined;
}
