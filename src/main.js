import { createApp } from 'vue'
import '@styles/style.css'
import App from '@/App.vue'

/**
 * @typedef {Object} ElectronAPI
 * @property {() => Promise<string>} getVersion - Get the application version
 * @property {(channel: string, func: Function) => void} on - Listen to IPC events
 * @property {(channel: string, ...args: any[]) => void} send - Send IPC messages
 */

// Initialize the Vue application
const app = createApp(App)

// Add global properties for Electron API if available
if (window.electronAPI) {
  // Make electronAPI available in all components via this.$electron
  app.config.globalProperties.$electron = window.electronAPI
  
  // Example of using Electron API
  window.electronAPI.getVersion().then(version => {
    console.log(`App version: ${version}`)
  }).catch(err => {
    console.error('Failed to get app version:', err)
  })
  
  // Listen for updates from main process
  window.electronAPI.on('app:update-available', (info) => {
    console.log('Update available:', info)
    // You could show a notification to the user here
  })
  
  // Handle any errors from the main process
  window.electronAPI.on('error', (error) => {
    console.error('Error from main process:', error)
  })
}

// Mount the app
app.mount('#app')

// Expose app for HMR in development
if (import.meta.hot) {
  import.meta.hot.accept()
}

// Add electronAPI to window type for better IDE support
if (typeof window !== 'undefined') {
  /**
   * @type {ElectronAPI}
   */
  window.electronAPI = window.electronAPI || null
}
