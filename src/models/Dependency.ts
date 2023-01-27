import * as os from 'os';

const HOME = os.homedir() ;


export class Dependency {

    constructor(public groupId?:string, public artifactId?:string, public version?:string, public classifier?:string) {
    }

    public toString(): string {
        return `${this.groupId}:${this.artifactId}:${this.version}:${this.classifier}`;
    }

    static getDependency(str: string): Dependency|undefined {
        const parts = str.split(':');
        let groupId = parts[0];
        let artifactId;
        let version;
        let classifier;
        if (parts.length > 1 ) {
            artifactId = parts[1];
        }
        if (parts.length > 2 ) {
            version = parts[2];
        }
        if (parts.length > 3 ) {
            classifier = parts[3];
        }
        if (groupId === undefined || artifactId === undefined) {
            return undefined;
        }
        return new Dependency(groupId, artifactId, version, classifier);
    }
}

const MAVEN_REPO = 'https://repo1.maven.org/maven2';

export function getLocalFile(groupId ?:string, artifactId?:string, version?: string): string | undefined {
    if (groupId === undefined || artifactId === undefined || version === undefined) {
        return undefined;
    }
    return `${HOME}/.m2/repository/${getSplitGroupId(groupId)}/${artifactId}/${version}/${artifactId}-${version}.pom`;
}

export function getRemoteUrl(groupId ?:string, artifactId?:string, version?: string): string | undefined {
    if (groupId === undefined || artifactId === undefined || version === undefined) {
        return undefined;
    }
    return `${MAVEN_REPO}/${getSplitGroupId(groupId)}/${artifactId}/${version}/${artifactId}-${version}.pom`;
}

export function getRemoteMetadata(groupId ?:string, artifactId?:string): string | undefined {
    if (groupId === undefined || artifactId === undefined) {
        return undefined;
    }
    return `${MAVEN_REPO}/${getSplitGroupId(groupId)}/${artifactId}/maven-metadata.xml`;
}

function getSplitGroupId(groupId:string):string {
    return groupId?.replace(/\./g,'/');
}
