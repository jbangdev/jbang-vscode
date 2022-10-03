import * as os from 'os';

const HOME = os.homedir() ;

export class Dependency {

    public getLocalFile(): string | undefined {
        if (this.groupId == undefined || this.artifactId === undefined || this.version === undefined) {
            return undefined;
        }
        const splitGroupId = this.groupId?.replace(/\./g,'/');
        return `${HOME}/.m2/repository/${splitGroupId}/${this.artifactId}/${this.version}/${this.artifactId}-${this.version}.pom`;
    }

    public getRemoteUrl(): string | undefined {
        if (this.groupId == undefined || this.artifactId === undefined || this.version === undefined) {
            return undefined;
        }
        const splitGroupId = this.groupId?.replace(/\./g,'/');
        return `https://repo1.maven.org/maven2/${splitGroupId}/${this.artifactId}/${this.version}/${this.artifactId}-${this.version}.pom`;
    }

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
