import { glob } from 'glob';
import Mocha from 'mocha';
import * as path from 'path';

export function run(): Promise<void> {
	// Create the mocha test
	const mochaOptions: Mocha.MochaOptions = {
		ui: 'tdd',
		color: true
	};
	const mocha = new Mocha(mochaOptions);

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		glob('**/**.test.js', { cwd: testsRoot })
			.then(files => {
				// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			} catch (err) {
				console.error(err);
				e(err);
				}
			})
			.catch(err => {
				console.error(err);
				e(err);
			});
	});
}
