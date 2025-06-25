const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (...args) => ipcRenderer.invoke(...args),
  send: (...args) => ipcRenderer.send(...args),
  on: (...args) => ipcRenderer.on(...args),
  removeAllListeners: (...args) => ipcRenderer.removeAllListeners(...args)
})