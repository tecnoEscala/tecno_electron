const { dialog } = require('electron');
const fetch = require("node-fetch");
var FormData = require('form-data');
const fs = require('fs');
var shell = require('shelljs');



exports.runContainer = function () {
  shell.echo('*** TODO: run docker container ***');
}

exports.pdfProtect = function (filepath, fileName, contextWindow) {
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

      systemMessage(contextWindow, 'error', 'No se pudo generar archivo pdf.', false);
    } else {
      console.log('Archivo PDF generado con éxito:', name);
      systemMessage(contextWindow, 'info', 'Archivo pdf generado con éxito. La ruta del archivo es ./Documents/TecnoEscalaReports/', false);
    }
    deleteUnsignedReport(filepath);
  });
}

// function deleteUnsignedReport(filepath) {
//   fs.unlinkSync(filepath);
// }

function systemMessage(win, type, message, closeWindow = true) {
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