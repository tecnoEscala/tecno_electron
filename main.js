// Modules to control application life and create native browser window
const { app, ipcMain, BrowserWindow, dialog } = require('electron')
const Store = require('electron-store');

const fs = require('fs')
const path = require('path')
const os = require('os')
const store = new Store();

const devMode = false;

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
            console.log('err', err);
            systemMessage(win, 'error', 'No se pudo generar archivo pdf.');
          } else {
            console.log('PDF Generated Successfully');
            systemMessage(win, 'info', 'Archivo pdf generado con éxito. La ruta del archivo es ./Documents/TecnoEscalaReports/');
          }
        });
      }).catch(error => {
        console.log('error', error)
        systemMessage(win, 'error', 'No se pudo generar archivo pdf.');
      });

    }, 2000);
  });
});

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