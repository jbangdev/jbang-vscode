import { CancellationToken, ProviderResult, ShellExecution, Task, TaskDefinition, TaskProvider, TaskRevealKind, TaskScope } from 'vscode';
import { jbang } from './JBangExec';

export class JBangTaskProvider implements TaskProvider {

	public static labelProvidedTask: string = "Debug JBang";

	provideTasks(token: CancellationToken): ProviderResult<Task[]> {
		const tasks: Task[] = [];
		const taskDefinition: TaskDefinition = {
			"label": JBangTaskProvider.labelProvidedTask,
			"type": "shell"
		};

		const task = new Task(
			taskDefinition,
			TaskScope.Workspace,
			JBangTaskProvider.labelProvidedTask,
			'jbang',
			new ShellExecution(jbang() + ' --debug ${relativeFile}'),
			"$jbang.debug.problemMatcher"
		);
		task.isBackground = true;
		task.presentationOptions.reveal = TaskRevealKind.Always;
		task.runOptions = {
			reevaluateOnRerun: true
		};
		tasks.push(task);

		return tasks;
	}

	resolveTask(task: Task, token: CancellationToken): ProviderResult<Task> {
		return task;
	}
}
