// Network-Level Ad-Blocking using EasyList
// VIP Sources are ad-free, Premium and other sources use EasyList blocking

import { EasyListParser, loadEasyListRules } from '../adblock/easyListParser';

export class AdBlocker {
  constructor() {
    this.easyListRules = [];
    this.initialized = false;
    this.blockedUrls = new Set(); // Track blocked URLs for logging
    console.log('[AdBlocker] Network-level mode initialized');
    this.initializeEasyList();
  }

  async initializeEasyList() {
    try {
      console.log('[AdBlocker] Loading EasyList rules...');
      this.easyListRules = await loadEasyListRules();
      this.initialized = true;
      console.log(`[AdBlocker] EasyList initialized with ${this.easyListRules.length} network rules`);
    } catch (error) {
      console.error('[AdBlocker] Failed to initialize EasyList:', error);
      this.initialized = false;
    }
  }

  // Main method: Check if URL should be blocked
  shouldBlockUrl(url, requestType = 'other', sourceId = '', currentDomain = '') {
    // Always allow VIP sources (they're ad-free)
    if (this.isVipSource(sourceId)) {
      return false;
    }

    // Only block for Premium and other sources if EasyList is ready
    if (!this.initialized || !this.easyListRules.length) {
      return false;
    }

    return this.checkEasyListBlocking(url, requestType, currentDomain);
  }

  // Check if source is VIP (ad-free)
  isVipSource(sourceId) {
    const vipSources = [
      'vip_fmftp', 'vip_moviebox', 'vip_roarzone', 'vip_crazyctg', 
      'vip_binudon', 'vip_spdx', 'vip_hydrahd_scrape', 'vip_ridomovies',
      'tmdb_vip_fmftp', 'tmdb_vip_moviebox', 'tmdb_vip_roarzone',
      'tmdb_vip_crazyctg', 'tmdb_vip_binudon', 'tmdb_vip_spdx'
    ];
    
    return vipSources.some(vip => sourceId.includes(vip));
  }

  // Use EasyList rules to check if URL should be blocked
  checkEasyListBlocking(url, requestType, currentDomain) {
    try {
      for (const rule of this.easyListRules) {
        if (EasyListParser.shouldBlock(url, requestType, currentDomain, rule)) {
          // Log blocked URL for server confirmation
          this.logBlockedUrl(url, rule.originalRule || rule.pattern);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.warn('[AdBlocker] Error checking EasyList rules:', error);
      return false;
    }
  }

  // Log blocked URLs for server confirmation
  logBlockedUrl(url, rule) {
    if (!this.blockedUrls.has(url)) {
      console.log(`[AdBlocker] 🚫 BLOCKED: ${url}`);
      console.log(`[AdBlocker] 📋 Rule: ${rule}`);
      this.blockedUrls.add(url);
      
      // Log to server if possible
      if (typeof fetch !== 'undefined') {
        this.sendBlockingLog(url, rule).catch(e => 
          console.log('[AdBlocker] Server logging failed (expected):', e.message)
        );
      }
    }
  }

  // Send blocking information to server for confirmation
  async sendBlockingLog(url, rule) {
    try {
      await fetch('/api/ad-blocking-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockedUrl: url,
          rule: rule,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      // Expected to fail in React Native - just for server testing
      throw error;
    }
  }

  // Legacy compatibility methods
  shouldBlockRequest(url, type) {
    return this.shouldBlockUrl(url, type);
  }

  getSourceConfigs() {
    return {}; // No source-specific configurations needed
  }

  generateIframeHTML(url, sourceId) {
    return null; // Let WebView handle iframe directly
  }

  getAdBlockingScript(sourceId) {
    return ''; // No additional scripts needed for network-level blocking
  }

  shouldInjectAdBlock(sourceId) {
    return false; // Network-level blocking doesn't need injection
  }

  // Get statistics for debugging
  getStats() {
    return {
      initialized: this.initialized,
      rulesLoaded: this.easyListRules.length,
      urlsBlocked: this.blockedUrls.size,
      blockedUrls: Array.from(this.blockedUrls).slice(-10) // Last 10 blocked URLs
    };
  }
}

export default AdBlocker;