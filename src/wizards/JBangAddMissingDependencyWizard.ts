import axios, { AxiosRequestConfig, CancelTokenSource } from 'axios';
import { Position, ProgressLocation, QuickPickItem, Range, TextDocument, TextEdit, Uri, WorkspaceEdit, window, workspace } from "vscode";
import { DEPS_PREFIX } from '../JBangUtils';
import { version } from '../extension';
import { compareVersions } from '../models/Version';
import { MultiStepInput, QuickPickParameters } from "./multiStepsUtils";
import { SelectDependencyState } from "./wizardState";

const axiosConfig: AxiosRequestConfig<any> = {
    httpsAgent: 'jbang-vscode v' + version,
    timeout: 30000
};

export default class JBangAddMissingDependencyWizard {
    constructor(private uri: Uri, private dependencies: string[]) {
    }

    public static async open(uri: Uri, missingType: string) {
        
        let results = await window.withProgress<string[]|undefined>({
            location: ProgressLocation.Notification,
            title: `Searching for '${missingType}' on Maven central...`,
            cancellable: true
        }, async (_progress, token) => {
            const cancelTokenSource = axios.CancelToken.source();
            token.onCancellationRequested(() => {
                cancelTokenSource.cancel();
            });

            const results = await JBangAddMissingDependencyWizard.searchClass(missingType, cancelTokenSource);
            if (!results || token.isCancellationRequested) {//Search was cancelled
                return undefined;
            }
            if (!results.numFound || !results.docs) {
                return [];
            }
            const sortedVersions = results.docs.sort(compareArtifactVersions);
            let lastGA;
            const candidates: string[] = [];
            for (let i = 0; i < sortedVersions.length; i++) {
                const candidate = sortedVersions[i];
                const candidateGA = candidate.g + ':' + candidate.a;
                if (candidateGA !== lastGA) {
                    lastGA = candidateGA;
                    candidates.push(candidate.id);
                }
            }
            return candidates;
        });
        if (!results) {
            //Search was cancelled
            return;
        }
        if (results.length === 0) {
            window.showWarningMessage(`No dependencies found for '${missingType}'`);
            return;
        }

        results = sortNamespaces(results, missingType);

        const wizard = new JBangAddMissingDependencyWizard(uri, results);
        await wizard.run();

    }

    private static async searchClass(missingClass: string, cancelTokenSource: CancelTokenSource): Promise<any> {
        if (missingClass.endsWith('.*')) {
            //Star import, we only have a package to deal with
            missingClass = missingClass.substring(0, missingClass.length - 2);
        }
        const searchType = missingClass.includes('.') ? 'fc' : 'c';
        const searchQuery = `https://search.maven.org/solrsearch/select?&rows=200&wt=json&q=${searchType}:${missingClass}`;
        
        try {
            const response = await axios.get(searchQuery, {
                ...axiosConfig,
                cancelToken: cancelTokenSource.token
            });
            return response?.data?.response;
        } catch (error) {
            if (!axios.isCancel(error)) {
                throw error;
            }
        }
        return undefined;
    }

    private async run() {
        const state: Partial<SelectDependencyState> = {
            totalSteps: 1,
            dependency: ''
        };
        await MultiStepInput.run(input => this.selectDependency(input, state));
        if (!state.dependency) {
            return;
        }
        const document = await workspace.openTextDocument(this.uri);
        if (document) {
            const line = findNextDepsLine(document);
            // Define a TextEdit
            const editRange = new Range(new Position(line, 0), new Position(line, 0));
            const textEdit = new TextEdit(editRange, "//DEPS " + state.dependency + '\n');

            const workspaceEdit = new WorkspaceEdit();
            workspaceEdit.set(this.uri, [textEdit]);
            return workspace.applyEdit(workspaceEdit).then(success => {
                if (success) {
                    return document.save();
                }
            });
        }
    }

    private async selectDependency(input: MultiStepInput, state: Partial<SelectDependencyState>) {
        const choices: QuickPickItem[] = [];
        this.dependencies.forEach(d => {
            choices.push({ label: d });
        });

        const choice = await input.showQuickPick<QuickPickItem, QuickPickParameters<QuickPickItem>>({
            title: "Select a dependency",
            items: choices,
            step: state.totalSteps,
            totalSteps: state.totalSteps,
            activeItem: choices[0]
        });

        state.dependency = choice?.label;
    }

}

const compareArtifactVersions = (a: { g: string, a: string, v: string }, b: { g: string, a: string, v: string }) => {
    let comparison = a.g.localeCompare(b.g);
    if (comparison !== 0) {
        return comparison;
    }
    comparison = a.a.localeCompare(b.a);
    if (comparison !== 0) {
        return comparison;
    }
    return compareVersions(b.v, a.v);
};

function compareNamespaces(reference: string, a: string, b: string): number {
    const referenceParts = reference.split('.');
    const aParts = a.split(':')[0].split('.');
    const bParts = b.split(':')[0].split('.');

    // Compare based on the length of common parts with reference
    const commonPartsA = aParts.filter((part, index) => part === referenceParts[index]);
    const commonPartsB = bParts.filter((part, index) => part === referenceParts[index]);

    if (commonPartsA.length !== commonPartsB.length) {
        return commonPartsB.length - commonPartsA.length; // Higher count of common parts first
    }

    // If common parts count is the same, compare lexicographically
    return a.localeCompare(b);
}

function sortNamespaces(namespaces: string[], reference: string): string[] {
    return namespaces.sort((a, b) => compareNamespaces(reference, a, b));
}

function findNextDepsLine(document: TextDocument): number {
    const lines = document.getText().split(/\r?\n/);
    let lastDepsIndex = 0;
    for (let index = 0; index < Math.min(lines.length, 100); index++) {
        const line = lines[index];
        if (line.startsWith(DEPS_PREFIX)) {
            lastDepsIndex = index;
        }
    }
    return lastDepsIndex + 1;
}