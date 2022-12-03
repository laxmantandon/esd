const {
    app,
    Menu,
    Tray,
    nativeImage,
    BrowserWindow,
    dialog,
  } = require('electron');
  
  const path = require('path');
  let process;
  const procs = [];
  // const {  server } = require('./server')
  const { exec, spawn } = require('child_process');
  const { kill } = require('process');
  const { application } = require('express');
const { default: axios } = require('axios');
  // const createWindow = () => {
  //   // Create the browser window.
  //   const mainWindow = new BrowserWindow({
  //     width: 800,
  //     height: 600,
  //   });
  
  //   // and load the index.html of the app.
  //   mainWindow.loadFile(path.join(__dirname, 'index.html'));
  
  //   // Open the DevTools.
  //   mainWindow.webContents.openDevTools();
  // };
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  const createTray = () => {
    const iconPath = path.join(__dirname, "./icon/icon.png")
    const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 })
    const tray = new Tray(trayIcon)
    const menuTemplate = [
      {
        label: null,
        enabled: false
      },
      {
        label: 'Start Server',
        enabled: true,
        click: () => {
            try{
                process = exec('npm run start_process');
              procs.push(process);
              process.on("exit", function() {
                procs.splice(procs.indexOf(process), 1)
              });
              }catch(e){
                console.log(e);
              }
          menuTemplate[1].enabled = false
          menuTemplate[2].enabled = true
          buildTrayMenu(menuTemplate)
  
          // server.listen(express.get('Port'), express.get('Host'), () => {
          //   menuTemplate[1].enabled = false
          //   menuTemplate[2].enabled = true
          //   buildTrayMenu(menuTemplate)
          // })
        }
      },
      {
        label: 'Stop Server',
        enabled: false,
        click: () => {

          axios.get('http://localhost:35040/stop')
          .then(res => {
            console.log("Response: ", res.data);
          })
          .catch(err => console.log("error: ", err))
          menuTemplate[1].enabled = true
          menuTemplate[2].enabled = false
          buildTrayMenu(menuTemplate)
          // server.close(e => {
          //   console.log('Connection Closed', e)
          //   menuTemplate[1].enabled = true
          //   menuTemplate[2].enabled = false
          //   buildTrayMenu(menuTemplate)
          // })
        }
      },
      {
        label: 'About',
        click: () => {
          dialog.showMessageBox({
            title: 'ESD',
            message: "ESD 1.03", //1.02
            detail: "Developed and Maintained",
            buttons: ['OK'],
            icon: "./icon/stop.png"
          })
        }
      },
      {
        label: 'Quit',
        click: () => app.quit()
      }
    ]
  
  
    const buildTrayMenu = menu => {
      let lblStatus = "Inactive"
      let iconStatus = "./icon/stop.png"
      if (!menu[1].enabled) {
        lblStatus = "Active"
        iconStatus = "./icon/start.png"
      }
  
      const iconStatusPath = path.join(__dirname, iconStatus)
  
      menu[0].label = `"Service Status " ${lblStatus}`
      menu[0].icon = nativeImage.createFromPath(iconStatusPath).resize({ width: 24, height: 24 })
  
      const trayMenu = Menu.buildFromTemplate(menu)
      tray.setContextMenu(trayMenu)
    }
  
    buildTrayMenu(menuTemplate)
    // exec('npm run start_process');
    try{
        process = exec('npm run start_process');
      procs.push(process);
      process.on("exit", function() {
        procs.splice(procs.indexOf(process), 1)
      });
      }catch(e){
        console.log(e);
      }
    menuTemplate[1].enabled = false
    menuTemplate[2].enabled = true
    buildTrayMenu(menuTemplate)
  
  
    // server.listen(express.get('Port'), express.get('Host'), () => {
    //   // menuTemplate[1].enabled = false
    //   // menuTemplate[2].enabled = true
    //   // buildTrayMenu(menuTemplate)
    // })
  
  }
  
  app.on('ready', createTray);
  
  // app.on("quit", () => {
  //   try {
  //       // kill(process.pid, 'SIGKILL');
    
  //       procs.forEach(function(proc) {
  //         console.log(proc.pid);
  //         proc.kill;
  //       });
  //     } catch (e) {
  //   console.log(e);
  //     }
  // });
  
  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and import them here.
  
  app.on('quit', () => {
    // server.close()
    process.kill();
  })