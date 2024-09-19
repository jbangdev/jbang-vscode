import * as assert from 'assert';
import { compareVersions } from '../../src/models/Version';


suite("Version comparator test", () => {
	test('Check equality', () => {
		assert.strictEqual(0, compareVersions('', ''));
        assert.strictEqual(0, compareVersions('1', '1'));
        assert.strictEqual(0, compareVersions('1.0', '1'));
        assert.strictEqual(0, compareVersions('1.0', '1.0.0'));
	});
    test('Check qualifiers', () => {
		assert.strictEqual(1, compareVersions('1.0.ALPHA2', '1.0.0.ALPHA1'));
        assert.strictEqual(1, compareVersions('1-BETA1', '1.0.0.ALPHA1'));
        assert.strictEqual(-1, compareVersions('6.0.0.ALPHA2', '6.1.1.ALPHA1'));
        assert.strictEqual(1, compareVersions('6.0.0', '6.0.0.ALPHA1')); //release > alpha
        assert.strictEqual(1, compareVersions('6.0.0.RC1', '6.0.0.ALPHA1')); // rc > alpha
        assert.strictEqual(1, compareVersions('4.10.0-RC1', '4.10.0.alpha-1')); // rc > alpha, regardless of case

        const versions = ['4.10.0', '4.10.0-alpha-1', '4.10.0-RC1'];
        const expected = ['4.10.0-alpha-1', '4.10.0-RC1', '4.10.0'];
        const result = versions.sort(compareVersions);
        assert.deepStrictEqual(result, expected);
    });
});
