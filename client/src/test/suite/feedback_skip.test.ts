import { expect } from 'expect';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as common from './common';

suite('Should get diagnostics in the appropriate tab', function () {

	this.timeout(20000);

	test('Skipping proofs', async () => {
    console.log("1");

		const ext = vscode.extensions.getExtension('maximedenes.vscoq')!;
    console.log("2");
		
    const doc1 = await common.openTextFile('delegate_proof.v');
    console.log("3");

		await ext.activate();
    console.log("4");

		vscode.workspace.getConfiguration().update('vscoq.proof.delegation','Skip');
    console.log("5");
		vscode.workspace.getConfiguration().update('vscoq.proof.mode','Continuous');
    console.log("6");

		const doc2 = await common.openTextFile('warn.v');
    console.log("7");

		await common.sleep(10000); // Wait for server initialization
    console.log("8");

		const diagnostics1 = vscode.languages.getDiagnostics(doc1);
    console.log("9");
		const diagnostics2 = vscode.languages.getDiagnostics(doc2);
    console.log("10");

		// XXX these should not be there!!
		expect(diagnostics1.length).toBe(2);
    console.log("11");
		expect(diagnostics1[1].message).toMatch(/.*foobar was not found.*/);
    console.log("12");
		expect(diagnostics1[1].severity).toBe(vscode.DiagnosticSeverity.Error);
    console.log("13");
		expect(diagnostics1[0].message).toMatch(/.*Attempt to save an incomplete proof.*/);
    console.log("14");
		expect(diagnostics1[0].severity).toBe(vscode.DiagnosticSeverity.Error);
    console.log("15");

		expect(diagnostics2.length).toBe(1);
    console.log("16");
		expect(diagnostics2[0].message).toMatch(/.*There is no flag or option.*/);
    console.log("17");
		expect(diagnostics2[0].severity).toBe(vscode.DiagnosticSeverity.Warning);
    console.log("18");
	
	});

});
