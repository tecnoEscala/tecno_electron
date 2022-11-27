// Modules to control application life and create native browser window
const { app, ipcMain, BrowserWindow, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')

const mainLoadFile = './tecno-escala-desktop/index.html';
// const mainLoadFile = '../tecno_desktop/dist/tecno-escala-desktop/index.html';

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
  // and load the index.html of the app.
  mainWindow.loadFile(mainLoadFile);
  // mainWindow.loadURL('http://localhost:4200/')
  mainWindow.maximize();
  mainWindow.show();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


/* ipcMain is listening the "message" channel, and when the message arrives, 
  it replies with "pong" */
// ipcMain.on("message", (event, message) => {
//   if (message === "ping") {
//     // event.reply("reply", "pong"); 
//     console.log('aca llego el mensaje');
//   }
// });

ipcMain.on("newReportWindow", (event, url) => {
  let reportWin = new BrowserWindow({
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
})


ipcMain.on("generatePdf", (event, args) => {

  const { url, name } = JSON.parse(args)
  const documentsDirectory = path.join(os.homedir(), '/Documents/TecnoEscalaReports');

  if (!fs.existsSync(documentsDirectory)) {
    fs.mkdirSync(documentsDirectory);
  }

  var filepath2 = path.join(documentsDirectory, `report_${name}.pdf`);
  var options2 = {
    marginsType: 1,
    pageSize: 'A4',
    printBackground: false,
    printSelectionOnly: false,
    landscape: false
  }

  let win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    }
  });

  win.loadURL(url);
  // win.show();

  win.webContents.on('did-finish-load', () => {
    win.webContents.printToPDF(options2).then(data => {
      fs.writeFile(filepath2, data, function (err) {
        if (err) {
          console.log('err', err);
          relaunchApp(win, 'error', 'No se pudo generar archivo pdf.')
        } else {
          console.log('PDF Generated Successfully');
          relaunchApp(win, 'info', 'Archivo pdf generado con éxito. La ruta del archivo es ./Documents/TecnoEscalaReports/')
        }
      });
    }).catch(error => {
      console.log('error', error)
      relaunchApp(win, 'error', 'No se pudo generar archivo pdf.')
    });

  });

});


function relaunchApp(win, type, message) {
  dialog.showMessageBox(win, {
    type,
    title: 'Tecno Escala System',
    message,
  });
}