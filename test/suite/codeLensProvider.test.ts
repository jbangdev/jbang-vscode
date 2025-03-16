import * as assert from "assert";
import * as vscode from "vscode";
import { getMainMethodPosition } from "../../src/CodeLensProvider";

suite("CodeLensProvider Test Suite", () => {
  test("getMainMethodPosition with regular main method", () => {
    const line = "public static void    main(String[]   args) {";
    const result = getMainMethodPosition(10, line);
    assert.ok(result instanceof vscode.Range, "result is not a range");
    assert.strictEqual(result.start.line, 10, "invalid start line");
    assert.strictEqual(result.start.character, 0, "invalid start character");
  });

  test("getMainMethodPosition with no main method", () => {
    const line = "public void someOtherMethod() {";
    const result = getMainMethodPosition(5, line);
    assert.strictEqual(result, undefined, "result is not undefined");
  });

  test("getMainMethodPosition with instance main method no brace", () => {
    const line = "  void   main( ) ";
    const result = getMainMethodPosition(15, line);
    assert.ok(result instanceof vscode.Range, "result is not a range");
    assert.strictEqual(result.start.line, 15, "invalid start line");
    assert.strictEqual(result.start.character, 2, "invalid start character");
  });

  test("getMainMethodPosition with instance main method and args", () => {
    const line = "  void   main(    String[]    args    )  {";
    const result = getMainMethodPosition(15, line);
    assert.ok(result instanceof vscode.Range, "result is not a range");
    assert.strictEqual(result.start.line, 15, "invalid start line");
    assert.strictEqual(result.start.character, 2, "invalid start character");
  });
});
