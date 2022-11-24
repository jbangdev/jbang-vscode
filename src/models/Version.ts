export class Version {
    public major = 0;
    public minor = 0;
    public micro = 0;
    public qualifier = '';

    constructor(version: string){
        this.parse(version);
    }
    private parse(version: string) {
        const parts = version.replace('-','.').split('.');
        let remainder: string;
        if (parts.length > 0) {
            const maj = parts.shift()!;
            if (isDigit(maj)) {
                this.major = parseInt(maj);
            } else {
                this.qualifier = version;
                return;
            }
        }
        if (parts.length > 0) {
            const min = parts.shift()!;
            if (isDigit(min)) {
                this.minor = parseInt(min);
            } else {
                remainder = parts.join('.');
                this.qualifier = (remainder)? min+'.'+remainder: min;
                return;
            }
        }
        if (parts.length > 0) {
            const mic = parts.shift()!;
            if (isDigit(mic)) {
                this.micro = parseInt(mic);
            } else {
                remainder = parts.join('.');
                this.qualifier = (remainder)? mic+'.'+remainder: mic;
                return;
            }
        }
        if (parts.length > 0) {
            this.qualifier = parts.join('.');
        }
    }
}

export function compareVersionsDesc(v1: string, v2:string) {
    return compareVersions(v2, v1);
}

export function compareVersions(v1: string, v2:string) {
    if (v1 === v2) {
        return 0;
    }
    return compareOSGiVersions(new Version(v1), new Version(v2));
}

export function compareOSGiVersions(v1: Version, v2:Version) {
    if (v1 === v2) { // quicktest
        return 0;
    }

    let result = v1.major - v2.major;
    if (result != 0) {
        return result;
    }

    result = v1.minor - v2.minor;
    if (result != 0) {
        return result;
    }

    result = v1.micro - v2.micro;
    if (result != 0) {
        return result;
    }
    if (v1.qualifier === v2.qualifier) {
        return 0;
    }
    if (v1.qualifier === '') {
        return 1;
    }
    if (v2.qualifier === '') {
        return -1;
    }
    return v1.qualifier.toLowerCase() < v2.qualifier.toLowerCase() ? -1 : 1;
}

function isDigit(v: string): boolean {
    return /^\d+$/.test(v);
}

