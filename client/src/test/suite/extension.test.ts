import { expect } from 'expect';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as common from './common';

suite('Should get diagnostics', function () {

	this.timeout(30000);

	test('Diagnoses an undefined ref error', async () => {
    console.log('1');

		const ext = vscode.extensions.getExtension('maximedenes.vscoq')!;
    console.log('2');
    const doc = await common.openTextFile('basic.v');
    console.log('3');

		await ext.activate();
    console.log('4');
		vscode.workspace.getConfiguration().update('vscoq.proof.mode','Continuous');
    console.log('5');

		// await common.sleep(10000); // Wait for server initialization
    console.log('6');

		const diagnostics = vscode.languages.getDiagnostics(doc);
    console.log('7');
		
		expect(diagnostics.length).toBe(1);
    console.log('8');

		const diagnostic = diagnostics[0];
    console.log('9');

		expect(diagnostic.message).toMatch(/The reference zar was not found.*/);
    console.log('10');
		
		expect(diagnostic.severity).toBe(vscode.DiagnosticSeverity.Error);
    console.log('11');
	
	});


	test('Opens two files and gets feedback', async () => {
    console.log('1');

		const ext = vscode.extensions.getExtension('maximedenes.vscoq')!;
    console.log("1");
    
    const doc1 = await common.openTextFile('basic.v');
    console.log("2");

		await ext.activate();
    console.log("3");
		vscode.workspace.getConfiguration().update('vscoq.proof.mode','Continuous');
    console.log("4");

		const doc2 = await common.openTextFile('warn.v');
    console.log("5");

		await common.sleep(10000); // Wait for server initialization
    console.log("6");

		const diagnostics1 = vscode.languages.getDiagnostics(doc1);
    console.log("7");
		const diagnostics2 = vscode.languages.getDiagnostics(doc2);
    console.log("8");

		expect(diagnostics1.length).toBe(1);
    console.log("9");
		expect(diagnostics2.length).toBe(1);
    console.log("10");
	
	});

});
