import { Platform } from 'react-native'

export class SecurityChecker {
  static async checkDeviceSecurity() {
    if (__DEV__) {
      // Skip checks in development
      return { safe: true, checks: {} }
    }

    const checks = {
      debugger: this.checkDebugger(),
      emulator: this.checkEmulator(),
      tampering: this.checkTampering(),
    }

    return {
      safe: !Object.values(checks).some(v => v === true),
      checks,
    }
  }

  static checkDebugger() {
    // Check if debugger is attached
    const start = Date.now()
    debugger
    const end = Date.now()
    
    // If debugger attached, there will be a delay
    return (end - start) > 100
  }

  static checkEmulator() {
    if (Platform.OS === 'android') {
      // Check for common emulator indicators
      const { Brand, Model } = Platform.constants
      const emulatorBrands = ['google', 'generic', 'unknown']
      const emulatorModels = ['sdk', 'emulator', 'android sdk']
      
      return emulatorBrands.some(b => Brand?.toLowerCase().includes(b)) ||
             emulatorModels.some(m => Model?.toLowerCase().includes(m))
    }
    return false
  }

  static checkTampering() {
    // Check if global objects have been modified
    if (typeof global.__FRIDA !== 'undefined') {
      return true
    }
    
    // Check if Function.prototype.toString has been modified
    const original = Function.prototype.toString
    return original.toString().length < 50
  }

  static async enforce() {
    const result = await this.checkDeviceSecurity()
    
    if (!result.safe) {
      // Exit app or show error
      console.error('Security violation detected')
      return false
    }
    
    return true
  }
}
