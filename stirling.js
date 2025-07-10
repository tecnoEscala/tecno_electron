const fetch = require("node-fetch");
var FormData = require('form-data');
const fs = require('fs');
var shell = require('shelljs');



exports.runContainer = function() {
    shell.echo('*** TODO: run docker container ***');
}

exports.pdfProtect = function(filepath, fileName) {
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
        'accept': '*/*',
      }
    
      fetch('https://localhost:8080/api/v1/security/add-password', {
        method: 'POST',
        headers: headers,
        body: form
      }).then(response => {
        console.log('stirlingResponse');
        if (response.status >= 400) { throw new Error("Bad response from server"); }
        response.buffer().then(data => {
          // fs.writeFileSync('/home/leninriv/Descargas/upload.pdf', data);
          createFileInSystem(filepath, data, fileName);
        });
    
      }).catch(err => {
        // systemMessage(mainWindow, 'error', 'No se pudo generar archivo pdf.', false);
        console.error(err);
      });
}


