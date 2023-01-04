import axios, { AxiosRequestConfig } from "axios";
import { XMLParser } from "fast-xml-parser";
import * as fs from 'fs/promises';
import * as LRUCache from "lru-cache";
import { MarkdownString } from "vscode";
import { CancellationToken } from "vscode-languageclient";
import { version } from "./extension";
import { Dependency } from "./models/Dependency";

const DOC_CACHE = new LRUCache<string, MarkdownString>({
    max: 500,
    // for use with tracking overall storage size
    maxSize: 500,
    // how long to live in ms
    ttl: 1000 * 60 * 10,// 10 min
    sizeCalculation: (value: MarkdownString, key: string) => {
        return 1;
    },
    // return stale items before removing from cache?
    allowStale: false,
});

const axiosConfig: AxiosRequestConfig<any> = {
    httpsAgent: 'jbang-vscode v' + version
};

export class DocumentationProvider {
    public async getDocumentation(dependency: Dependency, _token: CancellationToken): Promise<MarkdownString|undefined> {
        const gav = dependency.toString();
        if (DOC_CACHE.has(gav)) {
            return DOC_CACHE.get(gav);
        }
        const pom = await this.loadPom(dependency);
        if (!pom) {
            return undefined;
        }
        const name = (pom?.project?.name)? pom?.project?.name : pom?.project?.artifactId;
        let description = `**${name}**`;
        if (pom?.project?.description) {
            description += `\n\n${pom?.project?.description}`;
        }
        const markdown = this.toMarkdown(description);
        let doc:MarkdownString|undefined;
        if (markdown) {
            doc = new MarkdownString(markdown);
            DOC_CACHE.set(gav, doc);
        }
        return doc;
    }
    
    private async loadPom(dependency: Dependency): Promise<any> {
        const filePath = dependency.getLocalFile(); 
        if (!filePath) {
            return undefined;
        }
        let xml:string|undefined;
        try {
            xml = await fs.readFile(filePath, "utf8");
        } catch (error) {
            const pomUrl = dependency.getRemoteUrl();
            if (pomUrl) {
                xml = await getRemotePom(pomUrl);
                //TODO save xml locally to prevent future remote calls
            }
        }
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
    
    private toMarkdown(xml?: string): string|undefined {
        if (!xml) {
            return undefined;
        }
        return xml;
    }
}

export default new DocumentationProvider();

async function getRemotePom(uri: string): Promise<string|undefined> {
    console.log(`Fetching ${uri}`);
    const response = await axios.get(uri, axiosConfig);
    return response.data;
}
