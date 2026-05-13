// const { app, BrowserWindow, dialog } = require('electron');
// const { autoUpdater } = require('electron-updater');
// const path = require('path');

// function createWindow() {
//   const win = new BrowserWindow({
//     width: 1400,
//     height: 900,
//     minWidth: 1024,
//     minHeight: 700,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//     },
//     title: 'Grow Lotus CRM',
//     autoHideMenuBar: true,
//   });

//   win.loadFile(path.join(__dirname, '../dist/index.html'));

//   autoUpdater.setFeedURL({
//     provider: 'github',
//     owner: 'Kalpna1729',
//     repo: 'CRM',
//     token: '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'
//   });

//   autoUpdater.checkForUpdates();

//   autoUpdater.on('update-available', () => {
//     dialog.showMessageBox({
//       type: 'info',
//       title: 'Update Available',
//       message: 'Naya update mil gaya! Download ho raha hai...',
//       buttons: ['OK']
//     });
//   });

//   autoUpdater.on('error', (err) => {
//     dialog.showMessageBox({
//       type: 'error',
//       title: 'Update Error',
//       message: err.message || err.toString(),
//       buttons: ['OK']
//     });
//   });

//   autoUpdater.on('error', (err) => {
//     console.log('Update error:', err);
//   });
// }

// app.whenReady().then(createWindow);

// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) createWindow();
// });


const { app, BrowserWindow, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Grow Lotus CRM',
    autoHideMenuBar: true,
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'Kalpna1729',
    repo: 'CRM',
    token: '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'
  });

  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: 'Naya update mil gaya! Download ho raha hai...',
      buttons: ['OK']
    });
  });

  autoUpdater.on('error', (err) => {
    dialog.showMessageBox({
      type: 'error',
      title: 'Update Error',
      message: err.message || err.toString(),
      buttons: ['OK']
    });
  });

  autoUpdater.on('error', (err) => {
    console.log('Update error:', err);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});