import { expect } from 'expect';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as common from './common';

suite('Should get diagnostics in the appropriate tab', function () {

	this.timeout(20000);

	test('Checking proofs in master', async () => {
    console.log("1");

		const ext = vscode.extensions.getExtension('maximedenes.vscoq')!;
    console.log("1");
    
    const doc1 = await common.openTextFile('basic.v');
    console.log("1");

		await ext.activate();
    console.log("2");

		vscode.workspace.getConfiguration().update('vscoq.proof.mode','Continuous');
    console.log("3");
        
		const doc2 = await common.openTextFile('warn.v');
    console.log("4");

		await common.sleep(10000); // Wait for server initialization
    console.log("5");

		const diagnostics1 = vscode.languages.getDiagnostics(doc1);
    console.log("6");
		const diagnostics2 = vscode.languages.getDiagnostics(doc2);
    console.log("7");

		expect(diagnostics1.length).toBe(1);
    console.log("8");
		expect(diagnostics1[0].message).toMatch(/The reference zar was not found.*/);
    console.log("9");
		expect(diagnostics1[0].severity).toBe(vscode.DiagnosticSeverity.Error);
    console.log("10");

		expect(diagnostics2.length).toBe(1);
    console.log("11");
		expect(diagnostics2[0].message).toMatch(/.*There is no flag or option.*/);
    console.log("12");
		expect(diagnostics2[0].severity).toBe(vscode.DiagnosticSeverity.Warning);
    console.log("13");
	
	});

});
