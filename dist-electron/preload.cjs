const { contextBridge, ipcRenderer } = require('electron')

/**
 * List of valid channels for IPC communication from renderer to main
 * @type {string[]}
 */
const validSendChannels = [
  'app:restart',
  'app:check-updates',
  'app:minimize-window',
  'app:maximize-window',
  'app:close-window'
]

/**
 * List of valid channels for IPC communication from main to renderer
 * @type {string[]}
 */
const validReceiveChannels = [
  'app:update-available',
  'app:update-downloaded',
  'app:error'
]

// Create a safe IPC bridge between main and renderer processes
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Get the application version
   * @returns {Promise<string>} The application version
   */
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  /**
   * Listen to events from the main process
   * @param {string} channel - The channel to listen on
   * @param {Function} callback - The callback function
   */
  on: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      // Strip event as it includes `sender` which we don't want to expose
      const subscription = (event, ...args) => callback(...args)
      ipcRenderer.on(channel, subscription)
      
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(channel, subscription)
      }
    } else {
      console.warn(`Attempted to listen to invalid channel: ${channel}`)
    }
  },
  
  /**
   * Send a message to the main process
   * @param {string} channel - The channel to send the message on
   * @param {any} [data] - The data to send
   */
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    } else {
      console.warn(`Attempted to send to invalid channel: ${channel}`)
    }
  },
  
  /**
   * Send a message to the main process and wait for a response
   * @param {string} channel - The channel to send the message on
   * @param {any} [data] - The data to send
   * @returns {Promise<any>} The response from the main process
   */
  invoke: async (channel, data) => {
    if (validSendChannels.includes(channel)) {
      return await ipcRenderer.invoke(channel, data)
    } else {
      console.warn(`Attempted to invoke invalid channel: ${channel}`)
      throw new Error(`Invalid channel: ${channel}`)
    }
  },
  
  /**
   * Remove all listeners for a channel
   * @param {string} channel - The channel to remove listeners from
   */
  removeAllListeners: (channel) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel)
    } else {
      console.warn(`Attempted to remove listeners from invalid channel: ${channel}`)
    }
  }
})
