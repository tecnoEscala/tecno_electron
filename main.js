// Modules to control application life and create native browser window
// const { app, ipcMain, BrowserWindow, dialog, clipboard } = require('electron')
// const Store = require('electron-store');

// const fs = require('fs')
// const path = require('path')
// const os = require('os')
// const attachmentStore = new Store({ name: 'attachments' });
// const fetch = require("node-fetch");
// // const { fileFromSync }= require('node-fetch');
// var FormData = require('form-data');


import { app, ipcMain, BrowserWindow, dialog, clipboard } from 'electron';

import Store from 'electron-store';
import fs from 'fs';
import os from 'os';
import fetch, { fileFromSync } from 'node-fetch';
// import FormData from 'form-data';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const store = new Store();
const attachmentStore = new Store({ name: 'attachments' });
const devMode = true;

const mainLoadFile = './tecno-escala-desktop/index.html';

let currentReport;
let multipleReports = [];

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    icon: 'icon.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    }
  })

  if (!devMode) {
    mainWindow.loadFile(mainLoadFile);
  } else {
    mainWindow.loadURL('http://localhost:4200/');
  }
  mainWindow.maximize();
  mainWindow.show();

  store.set('appVersion', JSON.stringify({ version: app.getVersion() }));

  mainWindow.on('close', function (e) {
    if (process.platform !== 'darwin') app.quit();
  });

  // C:\Users\lenin\AppData\Roaming\tecnoescala
  // console.log('database address', app.getPath('userData'));

  // Open the DevTools.
  if (devMode) mainWindow.webContents.openDevTools();


  pdfProtectInApi("/home/leninriv/Descargas/report.pdf", mainWindow, 'report.pdf');

}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
})


// database Get
ipcMain.on("database-get", (event, key) => {
  event.reply(key, store.get(key));
});

// database set
ipcMain.on("database-set", (event, args) => {
  const { key, value } = JSON.parse(args);
  store.set(key, value);
});

// database reset
ipcMain.on("database-reset", (event, args) => {
  store.clear();
});


/** Local store attachments in base64 */

// attachment Get
ipcMain.on("attachment-get", (event, key) => {
  event.reply(key, attachmentStore.get(key));
});

// attachment set
ipcMain.on("attachment-set", (event, args) => {
  const { key, value } = JSON.parse(args);
  attachmentStore.set(key, value);
});

// attachment reset
ipcMain.on("attachment-reset", (event, args) => {
  attachmentStore.clear();
});




// ipcMain.on("store-get", (event, key) => {
//   vent.reply("res", Store.get(key));
// });

/* ipcMain is listening the "message" channel, and when the message arrives, 
  it replies with "pong" */
// ipcMain.on("message", (event, message) => {
//   if (message === "ping") {
//     // event.reply("reply", "pong"); 
//     console.log('aca llego el mensaje');
//   }
// });

ipcMain.on("newSmallWindow", (event, url) => {
  const smallWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 500,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    }
  });
  smallWindow.loadURL(url);
  // smallWindow.maximize();
  smallWindow.show();

  if (devMode) smallWindow.webContents.openDevTools();
})


ipcMain.on("newReportWindow", (event, url) => {
  const reportWin = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    }
  });
  reportWin.loadURL(url);
  reportWin.maximize();
  reportWin.show();
  // Global variable reportWin

  if (url.includes('weight_scale_print')) {
    if (multipleReports?.length >= 2) multipleReports = [];
    multipleReports.push({ url, win: reportWin });
  } else {
    currentReport = reportWin;
  }

  if (devMode) reportWin.webContents.openDevTools();
})

ipcMain.on("persistErrors", (event, args) => {
  const { field, value } = JSON.parse(args);
  const documentsDirectory = path.join(os.homedir(), '/Documents/TecnoEscalaReports');
  if (!fs.existsSync(documentsDirectory)) {
    fs.mkdirSync(documentsDirectory);
  }
  var filepath = path.join(documentsDirectory, 'erros.json');
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, JSON.stringify({ [field]: value }) + ',\n\n');
  } else {
    fs.appendFileSync(filepath, JSON.stringify({ [field]: value }) + ',\n\n');
  }
})

ipcMain.on("persistSync", (event, args) => {
  const { value } = JSON.parse(args);
  const documentsDirectory = path.join(os.homedir(), '/Documents/TecnoEscalaReports');
  if (!fs.existsSync(documentsDirectory)) {
    fs.mkdirSync(documentsDirectory);
  }
  var filepath = path.join(documentsDirectory, 'syncQueue.json');
  fs.writeFileSync(filepath, JSON.stringify(value));
})

ipcMain.on("generatePdf", (event, args) => {

  const { url, name } = JSON.parse(args)
  const documentsDirectory = path.join(os.homedir(), '/Documents/TecnoEscalaReports');

  if (!fs.existsSync(documentsDirectory)) {
    fs.mkdirSync(documentsDirectory);
  }

  var parsedName = name.replace('/', '-');
  var filepath2 = path.join(documentsDirectory, `${parsedName}.pdf`);
  // Docs https://www.electronjs.org/docs/latest/api/web-contents

  // printSelectionOnly: false,
  // preferCSSPageSize: true,
  // fitToPageEnabled: true,
  var options2 = {
    "marginsType": 1,
    "landscape": false,
    "pageSize": 'A4',
    "margins": {
      "top": 0,
      "bottom": 0,
      "left": 0,
      "right": 0
    },
    "fitToPageEnabled": true,
  }

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    }
  });


  win.loadURL(url);

  if (url.includes('weight_scale_print')) {
    currentReport = multipleReports.find(item => item.url === url)?.win;
    multipleReports = multipleReports.filter(item => item.url !== url)
  }

  // currentReport.show();
  // currentReport.webContents.openDevTools();

  win.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      currentReport.webContents.printToPDF(options2).then(data => {


        fs.writeFile(filepath2, data, function (err) {
          if (err) {
            systemMessage(winContext, 'error', 'No se pudo generar archivo pdf.');
          } else {
            pdfProtectInApi(filepath2, win, `${parsedName}.pdf`);
          }
        });


      }).catch(error => {
        console.log('error', error)
        systemMessage(win, 'error', 'No se pudo generar archivo pdf.');
      });

    }, 1500);
  });
});


// {
//   fileInput: arrayBufferToBinary(pdfData),
//   ownerPassword: 'tecnotecno',
//   password: "tecnotecno",
//   keyLength: 40,
//   // canAssembleDocument: false,
//   // canExtractContent: false,
//   canExtractForAccessibility: false,
//   canFillInForm: false,
//   canModify: false,
//   canModifyAnnotations: false,
//   canPrint: false,
//   canPrintFaithful: false,
// }

// const headers = {
//   // 'X-API-KEY': '8971735c-6932-4a9f-be1f-4691ae8e7c9a',
//   'Content-Type': `multipart/form-data`,
//   'accept': '*/*'
// }

// pdfProtectInApi
function pdfProtectInApi(filepath, context, fileName) {

  console.log('****** Start protect pdf process ******');

  var form = new FormData();
  // var f = new File([filepath], fileName, { type: "application/pdf" });

  // var binaryData = fs.readFileSync(filepath);
  // var file =new File(fs.readFileSync(filepath), fileName, { type: "application/pdf" });

  form.append('fileInput', fileFromSync(filepath)); // application/pdf
  // form.append('fileInput', f);
  form.append('ownerPassword', 'tecnotecno');
  form.append('password', 'tecnotecno');
  form.append('keyLength', '256');

  const headers = {
    'accept': '*/*',
    'X-API-KEY': '294bfa6a-d111-4b14-9734-6d70949a1f23',
    'Content-Type': `multipart/form-data`
  }

  fetch('https://pdf.app.tecnoescala.com.ec/api/v1/security/add-password', {
    method: 'POST',
    headers: headers,
    body: form
  }).then(response => {
    console.log('stirlingResponse');
    // if (response.status >= 400) { throw new Error("Bad response from server"); }
    console.log(response);

    // console.log(response.status);
  }).catch(err => {
    console.error(err);
  });



  // axios.post('https://pdf.app.tecnoescala.com.ec/api/v1/security/add-password', form, { headers: headers })
  //   .then(function (response) {
  //     createFileInSystem(filepath, response, context);
  //     console.log('stirlingResponse');
  //   })
  //   .catch(function (error) {
  //     console.log('stirlingError', error.message);
  //     clipboard.writeText(error.toString());
  //   });
}


function createFileInSystem(filepath, buffer, winContext) {
  console.log(typeof buffer);

  fs.writeFile(filepath, buffer, function (err) {
    if (err) {
      console.log('err', err);
      systemMessage(winContext, 'error', 'No se pudo generar archivo pdf.');
    } else {
      console.log('PDF Generated Successfully');
      systemMessage(winContext, 'info', 'Archivo pdf generado con éxito. La ruta del archivo es ./Documents/TecnoEscalaReports/');
    }
  });
}

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