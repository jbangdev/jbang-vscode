import axios, { AxiosRequestConfig } from "axios";
import { XMLParser } from "fast-xml-parser";
import * as fs from 'fs/promises';
import { LRUCache } from "lru-cache";
import { MarkdownString } from "vscode";
import { CancellationToken } from "vscode-languageclient";
import { version } from "./extension";
import { Dependency, getLocalFile, getRemoteMetadata, getRemoteUrl } from "./models/Dependency";

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

const axiosConfig: AxiosRequestConfig<any> = {
    httpsAgent: 'jbang-vscode v' + version
};

const NO_DOC = new MarkdownString('');

export class DocumentationProvider {

    public async getDocumentation(dependency: Dependency, _token: CancellationToken): Promise<MarkdownString|undefined> {
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
        if (!pom) {
            return undefined;
        }
        const name = (pom?.project?.name)? pom.project.name : pom?.project?.artifactId;
        let description = `**${name}**`;
        if (pom?.project?.description) {
            description += `\n\n`;
            description += this.toMarkdown(pom?.project?.description);
        }
        let doc:MarkdownString|undefined;
        if (description) {
            doc = new MarkdownString(description);
            DOC_CACHE.set(gav, doc);
        }
        return doc;
    }
    
    private async loadPom(dependency: Dependency): Promise<any> {
        let realVersion = dependency.version;
        if (dependency.version === 'LATEST') {
            realVersion = await findLatestVersion(dependency);
            if (!realVersion) {
                return undefined;
            }
        }
        const filePath = getLocalFile(dependency.groupId, dependency.artifactId, realVersion); 
        if (!filePath) {
            return undefined;
        }
        let xml:string|undefined;
        try {
            xml = await fs.readFile(filePath, "utf8");
        } catch (error) {
            const pomUrl = getRemoteUrl(dependency.groupId, dependency.artifactId, realVersion);
            if (pomUrl) {
                xml = await fetchData(pomUrl);
                //TODO save xml locally to prevent future remote calls
            }
        }
        return parseXML(xml);
    }
    
    private toMarkdown(xml?: string): string|undefined {
        if (!xml) {
            return undefined;
        }
        return this.minimizeIndentation(xml);
    }

    private minimizeIndentation(inputText: string): string {
        //Need to minimize indentation, or else the doc looks like crap
        //See https://github.com/stleary/JSON-java/blob/92991770ca9f5e12d687bd9f6147d10e8baedd2e/pom.xml#L10-L21
        
        // Split the input text into lines
        const lines = inputText.split('\n');
        const result = lines.map(l => l.trim()).join('\n'); 
        return result;
    }
}

export default new DocumentationProvider();

async function fetchData(uri: string): Promise<string|undefined> {
    console.log(`Fetching ${uri}`);
    const response = await axios.get(uri, axiosConfig);
    return response.data;
}

async function findLatestVersion(dependency: Dependency): Promise<string|undefined> {
    const key = dependency.groupId+":"+dependency.artifactId;
    if (LATEST_VERSIONS_CACHE.has(key)) {
        return LATEST_VERSIONS_CACHE.get(key);
    }
    let xmlData;
    try {
        xmlData = await loadMetadata(dependency);
    } catch (e: any) {
        console.error(e);
    }
    let latestVersion:string|undefined;
    if (xmlData) {
        const xml = parseXML(xmlData);
        if (xml) {
            latestVersion = xml?.metadata?.versioning?.latest;
        }
    }
    if (!latestVersion) {
        latestVersion = '';
    }
    LATEST_VERSIONS_CACHE.set(key, latestVersion);
    return latestVersion;
}

async function loadMetadata(dependency: Dependency): Promise<string|undefined> {
    const metadataUrl = getRemoteMetadata(dependency.groupId, dependency.artifactId);
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
