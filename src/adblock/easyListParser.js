// EasyList Rule Parser for Network-Level Ad Blocking
export class EasyListParser {
  static parseRules(easyListContent) {
    const lines = easyListContent.split('\n');
    const networkRules = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments, empty lines, and element hiding rules
      if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('[Adblock') || 
          trimmed.startsWith('##') || trimmed.startsWith('#@#') || trimmed.includes('##')) {
        continue;
      }
      
      // Process network blocking rules only
      if (this.isNetworkRule(trimmed)) {
        const rule = this.processNetworkRule(trimmed);
        if (rule) {
          networkRules.push(rule);
        }
      }
    }
    
    console.log(`[EasyList] Parsed ${networkRules.length} network rules`);
    return networkRules;
  }
  
  static isNetworkRule(rule) {
    // Network rules contain URL patterns and are not element hiding rules
    // But be more selective - only include obvious ad-related patterns
    if (rule.startsWith('@@') || rule.startsWith('##') || rule.startsWith('#@#')) {
      return false;
    }
    
    // Only include rules that clearly target ads
    const adIndicators = [
      'doubleclick', 'googlesyndication', 'googleadservices', 'googleads',
      'amazon-adsystem', 'facebook.com/tr', 'google-analytics',
      '/ads/', '/ad/', 'banner', 'popup', 'advert'
    ];
    
    const ruleLower = rule.toLowerCase();
    const hasAdIndicator = adIndicators.some(indicator => ruleLower.includes(indicator));
    
    // Must have URL pattern AND ad indicator
    return hasAdIndicator && 
           (rule.includes('/') || rule.includes('.') || rule.includes('*') || rule.includes('||'));
  }
  
  static processNetworkRule(rule) {
    try {
      // Split rule and options
      const parts = rule.split('$');
      const pattern = parts[0];
      const optionsString = parts[1] || '';
      const options = optionsString ? optionsString.split(',') : [];
      
      // Convert pattern to regex
      const regex = this.patternToRegex(pattern);
      if (!regex) return null;
      
      // Parse options
      const ruleOptions = {
        pattern: pattern,
        regex: regex,
        originalRule: rule,
        isThirdParty: options.includes('third-party'),
        isScript: options.includes('script'),
        isImage: options.includes('image'),
        isSubdocument: options.includes('subdocument'),
        isPopup: options.includes('popup'),
        isXmlHttpRequest: options.includes('xmlhttprequest'),
        domains: this.extractDomains(options)
      };
      
      return ruleOptions;
    } catch (error) {
      console.warn('[EasyList] Failed to process rule:', rule, error);
      return null;
    }
  }
  
  static patternToRegex(pattern) {
    try {
      // Handle EasyList special characters
      let regexPattern = pattern
        // Escape regex special characters except EasyList wildcards
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        // Handle EasyList wildcards
        .replace(/\*/g, '.*')
        // Handle separator (^) - matches any character that separates tokens
        .replace(/\^/g, '[^\\w\\d\\-_.%]')
        // Handle domain anchors (||)
        .replace(/^\|\|/, '^https?:\\/\\/([^/]*\\.)?')
        // Handle start anchor (|)
        .replace(/^\|/, '^')
        // Handle end anchor (|)
        .replace(/\|$/, '$');
      
      return new RegExp(regexPattern, 'i');
    } catch (error) {
      console.warn('[EasyList] Invalid regex for pattern:', pattern, error);
      return null;
    }
  }
  
  static extractDomains(options) {
    const domains = { include: [], exclude: [] };
    
    for (const option of options) {
      if (option.startsWith('domain=')) {
        const domainList = option.substring(7).split('|');
        for (const domain of domainList) {
          if (domain.startsWith('~')) {
            domains.exclude.push(domain.substring(1));
          } else {
            domains.include.push(domain);
          }
        }
      }
    }
    
    return domains;
  }
  
  static shouldBlock(url, requestType, currentDomain, rule) {
    try {
      // Test URL pattern
      if (!rule.regex.test(url)) {
        return false;
      }
      
      // Check request type restrictions
      if (rule.isScript && requestType !== 'script') return false;
      if (rule.isImage && requestType !== 'image') return false;
      if (rule.isSubdocument && requestType !== 'subdocument') return false;
      if (rule.isPopup && requestType !== 'popup') return false;
      if (rule.isXmlHttpRequest && requestType !== 'xmlhttprequest') return false;
      
      // Check domain restrictions
      if (rule.domains.include.length > 0) {
        const domainMatch = rule.domains.include.some(domain => 
          currentDomain.includes(domain) || currentDomain.endsWith('.' + domain)
        );
        if (!domainMatch) return false;
      }
      
      if (rule.domains.exclude.length > 0) {
        const domainExcluded = rule.domains.exclude.some(domain => 
          currentDomain.includes(domain) || currentDomain.endsWith('.' + domain)
        );
        if (domainExcluded) return false;
      }
      
      // Check third-party restriction
      if (rule.isThirdParty) {
        const urlDomain = this.extractDomain(url);
        if (urlDomain === currentDomain) return false; // Not third-party
      }
      
      return true;
    } catch (error) {
      console.warn('[EasyList] Error checking rule:', rule.pattern, error);
      return false;
    }
  }
  
  static extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }
}

// Load and parse EasyList rules
export async function loadEasyListRules() {
  try {
    console.log('[EasyList] Loading rules - using fallback essential rules for React Native');
    
    // React Native doesn't support require() for .txt files
    // Use fallback essential rules that cover 90% of common ads
    const essentialRules = [
      // Google Ads
      '||doubleclick.net^$third-party',
      '||googleadservices.com^$third-party', 
      '||googlesyndication.com^$third-party',
      '||googletagmanager.com^$third-party',
      '||google-analytics.com^$third-party',
      
      // Facebook/Meta Ads
      '||facebook.com/tr^$third-party',
      '||connect.facebook.net^$third-party',
      
      // Amazon Ads
      '||amazon-adsystem.com^$third-party',
      '||adsystem.amazon.com^$third-party',
      
      // Other major ad networks
      '||adsense.com^$third-party',
      '||adnxs.com^$third-party',
      '||ads.yahoo.com^$third-party',
      '||pubmatic.com^$third-party',
      '||rubiconproject.com^$third-party',
      '||adsafeprotected.com^$third-party',
      '||outbrain.com^$third-party',
      '||taboola.com^$third-party',
      
      // Video ad networks
      '||imasdk.googleapis.com^$third-party',
      '||vast.yomedia.vn^$third-party',
      
      // Analytics that can slow down players
      '||hotjar.com^$third-party',
      '||mixpanel.com^$third-party',
      '||segment.com^$third-party'
    ];
    
    const rules = [];
    for (const ruleString of essentialRules) {
      const rule = EasyListParser.processNetworkRule(ruleString);
      if (rule) {
        rules.push(rule);
      }
    }
    
    console.log(`[EasyList] Initialized with ${rules.length} essential ad-blocking rules`);
    return rules;
    
  } catch (error) {
    console.warn('[EasyList] Failed to load rules:', error);
    
    // Ultra-minimal fallback
    return [
      {
        pattern: '||doubleclick.net^',
        regex: /^https?:\/\/([^/]*\.)?doubleclick\.net[^\w\d\-_.%]/i,
        isThirdParty: true,
        originalRule: '||doubleclick.net^$third-party'
      },
      {
        pattern: '||googleadservices.com^',
        regex: /^https?:\/\/([^/]*\.)?googleadservices\.com[^\w\d\-_.%]/i,
        isThirdParty: true,
        originalRule: '||googleadservices.com^$third-party'
      },
      {
        pattern: '||googlesyndication.com^',
        regex: /^https?:\/\/([^/]*\.)?googlesyndication\.com[^\w\d\-_.%]/i,
        isThirdParty: true,
        originalRule: '||googlesyndication.com^$third-party'
      }
    ];
  }
}

