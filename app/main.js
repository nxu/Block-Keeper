// main.js
// Main proccess of Block Keeper app
// Block Keeper
// Created by Dallas McNeil
'use strict';

const updater = require("electron-simple-updater");

const {dialog, app, BrowserWindow, Menu, localShortcut, TouchBar, nativeImage, ipcMain} = require('electron');
const {TouchBarButton, TouchBarLabel, TouchBarGroup, TouchBarSpacer} = TouchBar;
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const url = require('url');
var os = require("os");

let win;
let tnoodleWin;

// Setup menu bar items
const template = [{
    label: "Timer",
    submenu:[
        {label:"Result OK", accelerator:"CmdOrCtrl+1", click() {win.webContents.send('shortcut', 'CommandOrControl+1')}},
        {label:"Result +2", accelerator:"CmdOrCtrl+2", click() {win.webContents.send('shortcut', 'CommandOrControl+2')}},
        {label:"Result DNF", accelerator:"CmdOrCtrl+3", click() {win.webContents.send('shortcut', 'CommandOrControl+3')}},
        {type:'separator'},
        {label:"Add Time", accelerator: "CmdOrCtrl+T", click() {win.webContents.send('shortcut', 'CommandOrControl+T')}},
        {label:"Delete Lastest Time", accelerator: "CmdOrCtrl+Backspace", click (){win.webContents.send('shortcut', 'CommandOrControl+Backspace')}},
        {type:'separator'},
        {label:"New Session", accelerator:"CmdOrCtrl+N", click() {win.webContents.send('shortcut', 'CommandOrControl+N')}},
        {label:"Edit Session", accelerator:"CmdOrCtrl+E", click() {win.webContents.send('shortcut', 'CommandOrControl+E')}},
        {type:'separator'},
        {label:"Previous Scramble", accelerator:"CmdOrCtrl+Left", click() {win.webContents.send('shortcut', 'CommandOrControl+Left')}},
        {label:"Next Scramble", accelerator:"CmdOrCtrl+Right", click() {win.webContents.send('shortcut', 'CommandOrControl+Right')}},
        {type:'separator'},
        {label:"View Recording", accelerator:"CmdOrCtrl+P", click() {win.webContents.send('shortcut', 'CommandOrControl+P')}}
    ]}, {
    label: "Edit",
    submenu:[
        {label:"Cut", accelerator:"CmdOrCtrl+X", selector: "cut:"},
        {label:"Copy", accelerator:"CmdOrCtrl+C", selector: "copy:"},
        {label:"Paste", accelerator:"CmdOrCtrl+V", selector: "paste:"},
        {label:"Select All", accelerator:"CmdOrCtrl+A", selector:"selectAll:"}
    ]}, {
    role:'window',
    submenu: [
        {role:'close'},
        {role:'minimize'},
        {role:'togglefullscreen'},
        {type:'separator'},
        {label:"Zoom In", accelerator: "CmdOrCtrl+Plus", click() {win.webContents.send('shortcut', 'CommandOrControl+Plus')}},
        {label:"Zoom Out", accelerator: "CmdOrCtrl+-", click() {win.webContents.send('shortcut', 'CommandOrControl+-')}},
        {type:'separator'},
        {label:"Toggle Dev Tools", accelerator:"Shirt+CmdOrCtrl+I", click() {win.toggleDevTools()}},
        {label:"Reload", accelerator:"CmdOrCtrl+R", click() {win.webContents.send('shortcut', 'CommandOrControl+R')}},
        {type:'separator'},
        {label:"Mini size", accelerator:"CmdOrCtrl+I", click() {win.webContents.send('shortcut', 'CommandOrControl+I')}},
        {label:"Normal size", accelerator:"CmdOrCtrl+O", click() {win.webContents.send('shortcut', 'CommandOrControl+O')}}
    ]}, {
    role:'help',
    submenu: [
        {label:'Block Keeper Guide', click() { require('electron').shell.openExternal(path.join("file://",path.join(__dirname, '../docs/doc.html')))}}
    ]
}]

if (process.platform === 'darwin') {
    template.unshift({
        label:app.getName(),
        submenu:[
            {role:'about'},
            {type:'separator'},
            {label:"Preferences...", accelerator:"CmdOrCtrl+,", click() {win.webContents.send('shortcut', 'CommandOrControl+,')}},
            {type:'separator'},
            {role:'hide'},
            {role:'hideothers'},
            {role:'unhide'},
            {type:'separator'},
            {role: 'quit'}
        ]}
    )

    template[3].submenu = [
        {label:'Close', accelerator:'CmdOrCtrl+W', role:'close'},
        {label:'Minimize', accelerator:'CmdOrCtrl+M', role:'minimize'},
        {role:'togglefullscreen'},
        {type:'separator'},
        {label:'Bring All to Front', role:'front'},
        {type:'separator'},
        {label:"Zoom In", accelerator: "CmdOrCtrl+Plus", click() {win.webContents.send('shortcut', 'CommandOrControl+Plus')}},
        {label:"Zoom Out", accelerator: "CmdOrCtrl+-", click() {win.webContents.send('shortcut', 'CommandOrControl+-')}},
        {type:'separator'},
        {label:"Toggle Dev Tools", accelerator:"Shift+CmdOrCtrl+I", click() {win.toggleDevTools()}},
        {label:"Reload", accelerator:"CmdOrCtrl+R", click() {win.webContents.send('shortcut', 'CommandOrControl+R')}}
    ]
}

// Setup touch bar for new MacBook Pro's
const OKButton = new TouchBarButton({
    label:' OK ',
    backgroundColor:"#22BB22",
    click:() => {win.webContents.send('shortcut', 'CommandOrControl+1')}
})

const plus2Button = new TouchBarButton({
    label:' +2 ',
    backgroundColor:"#DD8822",
    click:() => {win.webContents.send('shortcut', 'CommandOrControl+2')}
})

const DNFButton = new TouchBarButton({
    label:' DNF ',
    backgroundColor:"#CC2222",
    click:() => {win.webContents.send('shortcut', 'CommandOrControl+3')}
})

const scramblePreviousButton = new TouchBarButton({
    label:'  Prev  ',
    click:() => {win.webContents.send('shortcut', 'CommandOrControl+Left')}
})

const scrambleNextButton = new TouchBarButton({
    label:'  Next  ',
    click:() => {win.webContents.send('shortcut', 'CommandOrControl+Right')}
})

const deleteButton = new TouchBarButton({
    icon:nativeImage.createFromPath(__dirname + '/images/delete.png'),
    click:() => {win.webContents.send('shortcut', 'CommandOrControl+Backspace')}
})

const miniSizeButton = new TouchBarButton({
    label:' Mini ',
    click:() => {win.webContents.send('shortcut', 'CommandOrControl+I')}
})

const normalSizeButton = new TouchBarButton({
    label:' Normal ',
    click:() => {win.webContents.send('shortcut', 'CommandOrControl+O')}
})



const touchBar = new TouchBar([
    new TouchBarGroup({items:[OKButton,
        plus2Button,
        DNFButton]}),
        new TouchBarSpacer({size: 'flexible'}),
        scramblePreviousButton,
        scrambleNextButton,
        new TouchBarSpacer({size: 'flexible'}),
        new TouchBarGroup({items: [
            miniSizeButton,
            normalSizeButton
        ]}),
        new TouchBarGroup({items:[deleteButton]}
    )
])

const menu = Menu.buildFromTemplate(template);

app.on('ready', function() {
    var titleBar = "default";
    if (os.type() === "Darwin") {
        var titleBar = "hidden";
    }

    global.appDetails = {version:require('../package.json').version, titleBar:titleBar};

    let mainWindowState = windowStateKeeper({
        defaultWidth:960,
        defaultHeight:640
    });

    win = new BrowserWindow({
        height:mainWindowState.height,
        width:mainWindowState.width,
        x:mainWindowState.x,
        y:mainWindowState.y,
        minHeight:150,
        minWidth:300,
        titleBarStyle:titleBar,
        show:false,
        backgroundColor: "#181818",    
        webPreferences: {
            nodeIntegration: true
        }
    });

    global.mainWindow = win;

    tnoodleWin = new BrowserWindow({
        height:10,
        width:10,
        x:0,
        y:0,
        minHeight:10,
        minWidth:10,
        show:false,
        backgroundColor: "#181818",    
        webPreferences: {
            nodeIntegration: true
        }
    });


    win.loadURL(url.format({
        pathname:path.join(__dirname, 'index.html'),
        protocol:'file:',
        slashes:true
    }));

    tnoodleWin.loadURL(url.format({
        pathname:path.join(__dirname, 'tnoodle.html'),
        protocol:'file:',
        slashes:true
    }));
    
    mainWindowState.manage(win);

    Menu.setApplicationMenu(menu);

    win.on('enter-full-screen', (e, cmd) => {
        win.webContents.send('fullscreen', "enter");
    });

    win.on('leave-full-screen', (e, cmd) => {
        win.webContents.send('fullscreen', "leave");
    });

    win.on('leave-full-screen', (e, cmd) => {
        win.webContents.send('fullscreen', "leave");
    });

    win.on('close', (e, cmd) => {
        win.webContents.send('quit', "quit");
        if (!tnoodleWin.isDestroyed()) {
            tnoodleWin.close();
        }
    });

    win.on('ready-to-show', function() {
        win.show();
        win.focus();
    });


    ipcMain.on("scramble", function(event, message) {
        tnoodleWin.webContents.send('scramble', message);
    });

    ipcMain.on("scramble-done", function(event, message) {
        win.webContents.send('scramble-done', message);
    });

    win.setTouchBar(touchBar);
});

function handler(e) {
    win.webContents.send('shortcut', e);
}

app.on('window-all-closed', function() {
    app.quit();
})
