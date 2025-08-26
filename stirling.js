const { app, dialog } = require('electron');
const fetch = require("node-fetch");
var FormData = require('form-data');
const fs = require('fs');
var exec = require('child_process').execFile;

let currentReport;

function executeStirling() {
  return new Promise((resolve, reject) => {
    const process = exec('C:/Program Files/Stirling PDF/Stirling PDF.exe', (error, data) => {
      if (error) reject(error);
    });
    setTimeout(() => {
      console.log('*** Stirling application on ***');
      resolve(process);
    }, 18000);
  });
}

function stirlingIsRunning() {
  const headers = {
    "accept": "*/*",
  }
  return new Promise((resolve, reject) => {
    fetch('http://localhost:8080', {
      method: 'GET',
      headers: headers,
    }).then(response => {
      if (response.status >= 400) resolve(false);
      resolve(true);
    }).catch(err => {
      resolve(false)
    });
  });
}

function killStirlingPdf(stirlingProcess) {
  setTimeout(() => {
    stirlingProcess.kill();
  }, 5000);
}

exports.p12ReportSign = async function (filepath, fileName, password, contextWindow, currentRep) {
  console.log('*** Run Stirling sign pdf ***');
  currentReport = currentRep;
  const tokenP12 = app.getPath('userData') + '/token.p12'; // C:\Users\lenin\AppData\Roaming\tecnoescala
  let stirlingProcess = null;
  if (!await stirlingIsRunning()) {
    stirlingProcess = await executeStirling();
  }
  var form = new FormData();
  const pdfFile = fs.createReadStream(filepath);
  const token = fs.createReadStream(tokenP12);
  form.append('certType', 'PKCS12');
  form.append('showSignature', 'false');
  form.append('showLogo', 'false');
  form.append('password', password);
  form.append('fileInput', pdfFile);
  form.append('p12File', token);

  const headers = {
    "accept": "*/*",
  }

  fetch('http://localhost:8080/api/v1/security/cert-sign', {
    method: 'POST',
    headers: headers,
    body: form
  }).then(response => {
    if (response.status >= 400) {
      throw new Error("No se puede firmar el archivo pdf");
    }
    response.buffer().then(data => {
      createFileInSystem(filepath, data, fileName, contextWindow);
    });
    if (stirlingProcess) killStirlingPdf(stirlingProcess);
  }).catch(err => {
    if (stirlingProcess) killStirlingPdf(stirlingProcess);
    console.error(err);
  });
}

exports.pdfProtectStirling = function (filepath, fileName, contextWindow) {
  console.log('****** Start protect pdf process ******');
  var form = new FormData();
  var binaryData = fs.createReadStream(filepath);
  form.append('fileInput', binaryData);
  form.append('ownerPassword', 'laboratorio15');
  form.append('password', 'servicio1');
  form.append('keyLength', '256');
  form.append('canAssembleDocument', 'false');
  form.append('canExtractContent', 'false');
  form.append('canExtractForAccessibility', 'false');
  form.append('canFillInForm', 'false');
  form.append('canModify', 'false');
  form.append('canModifyAnnotations', 'false');
  form.append('canPrint', 'false');
  form.append('canPrintFaithful', 'false');

  const headers = {
    "accept": "*/*",
    // 'X-API-KEY': 'a126298c-b5ff-435a-8824-b9b87e4c324d',
  }

  fetch('http://localhost:8080/api/v1/security/add-password', {
    method: 'POST',
    headers: headers,
    body: form
  }).then(response => {
    console.log('stirlingResponse');

    if (response.status >= 400) { throw new Error("Bad response from server"); }
    response.buffer().then(data => {
      createFileInSystem(filepath, data, fileName, contextWindow);
    });

  }).catch(err => {
    console.error(err);
  });
}

exports.deleteUnsignedReport = function (filepath) {
  fs.unlinkSync(filepath);
}

function createFileInSystem(filepath, buffer, fileName, contextWindow) {
  const name = filepath.replace('general.pdf', fileName);
  fs.writeFile(name, buffer, function (err) {
    if (err) {
      console.log('Error al escribir el archivo:', err);
      systemMessage(contextWindow, 'error', 'No se pudo generar archivo pdf.', true);
    } else {
      console.log('Archivo PDF generado con éxito:', name);
      systemMessage(contextWindow, 'info', 'Archivo pdf generado con éxito. La ruta del archivo es ./Documents/TecnoEscalaReports/', true);
    }
    fs.unlinkSync(filepath);
  });
}

function systemMessage(win, type, message, closeWindow = false) {
  dialog.showMessageBox(win, {
    type,
    title: 'Tecno Escala System',
    message,
  }).then(result => {
    if (closeWindow) {
      win.close();
      currentReport.close();
    }
  })
}