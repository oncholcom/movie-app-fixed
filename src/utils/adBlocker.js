// Smart Ad-Blocking System - Phase-based approach
export class AdBlocker {
  constructor() {
    this.sourceConfigs = this.getSourceConfigs();
  }

  // Source-specific ad-blocking configurations
  getSourceConfigs() {
    return {
      // VIP Sources - No ad-blocking needed
      vip_fmftp: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP FMFTP source - No ad-blocking needed'
      },
      
      vip_moviebox: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP MovieBox source - No ad-blocking needed'
      },
      
      vip_roarzone: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP RoarZone source - No ad-blocking needed'
      },
      
      vip_crazyctg: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP CrazyCTG source - No ad-blocking needed'
      },
      
      vip_binudon: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP Binudon source - No ad-blocking needed'
      },
      
      vip_spdx: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP SPDX source - No ad-blocking needed'
      },
      
      vip_hydrahd_scrape: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP HydraHD Scrape source - No ad-blocking needed'
      },
      
      vidrock: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'VidRock premium source - Medium ad-blocking for embed source'
      },
      
      spencerdevs: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'SpencerDevs premium source - Medium ad-blocking for embed source'
      },
      
      // All Anime VIP Sources (TMDB-based)
      tmdb_vip_fmftp: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP FMFTP Anime source - No ad-blocking needed'
      },
      
      tmdb_vip_moviebox: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP MovieBox Anime source - No ad-blocking needed'
      },
      
      tmdb_vip_roarzone: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP RoarZone Anime source - No ad-blocking needed'
      },
      
      tmdb_vip_crazyctg: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP CrazyCTG Anime source - No ad-blocking needed'
      },
      
      tmdb_vip_binudon: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP Binudon Anime source - No ad-blocking needed'
      },
      
      tmdb_vip_spdx: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP SPDX Anime source - No ad-blocking needed'
      },
      
      tmdb_vip_hydrahd_scrape: {
        needsAdBlocking: false,
        allowFullControls: true,
        adBlockingLevel: 'none',
        description: 'VIP HydraHD Scrape Anime source - No ad-blocking needed'
      },
      
      // All Anime Premium Sources (TMDB-based)
      tmdb_videasy_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'Videasy Premium Anime source - Medium ad-blocking for embed source'
      },
      
      tmdb_vidjoy_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'VidJoy Premium Anime source - Medium ad-blocking for embed source'
      },
      
      tmdb_hydrahd_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'HydraHD Premium Anime source - Medium ad-blocking for embed source'
      },
      
      tmdb_ridomovies_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'RidoMovies Premium Anime source - Medium ad-blocking for embed source'
      },
      
      tmdb_vidlink_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'VidLink Premium Anime source - Medium ad-blocking for embed source'
      },
      
      tmdb_vidsrc_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'VidSrc Premium Anime source - Medium ad-blocking for embed source'
      },
      
      tmdb_vidsrc_v3_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'VidSrc v3 Premium Anime source - Medium ad-blocking for embed source'
      },
      
      tmdb_xprime_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'XPrime Premium Anime source - Medium ad-blocking for embed source'
      },
      
      tmdb_vidrock_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'VidRock Premium Anime source - Medium ad-blocking for embed source'
      },
      
      tmdb_spencerdevs_premium: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'SpencerDevs Premium Anime source - Medium ad-blocking for embed source'
      },
      
      vidjoy: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        description: 'Light ad-blocking, preserve player controls'
      },
      
      hydrahd: {
        needsAdBlocking: false,
        allowFullControls: true,
        description: 'Already ad-free'
      },
      
      ridomovies: {
        needsAdBlocking: false,
        allowFullControls: true,
        errorHandling: 'api_fallback',
        description: 'API-based, needs error handling'
      },
      
      qstream: {
        needsAdBlocking: false,
        allowFullControls: true,
        description: 'Clean source, no blocking needed'
      },
      
      vidsrc_v3: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'light',
        description: 'Preserve video controls, light ad removal'
      },
      
      vidsrc_wtf_1: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'VidSrc API v1 - Enhanced ad-blocking'
      },
      
      videasy: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'Prevent external redirects'
      },
      
      
      nontongo: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        timeoutAvoidance: true,
        keepAlive: true,
        preloadStrategy: 'aggressive',
        description: 'Medium ad-blocking with timeout avoidance'
      },
      
      mappletv: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'light',
        description: 'Light blocking to preserve modern UI'
      },
      
      vidsrc: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        clickjackingProtection: true,
        description: 'Standard ad-blocking'
      },
      
      beech: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        description: 'Preserve episode selector'
      },
      
      hexa: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'heavy',
        clickjackingProtection: true,
        description: 'Heavy blocking needed'
      },
      
      streamhub: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'light',
        description: 'Light blocking for original content'
      },
      
      
      // Anime sources
      vidsrc_anime_sub: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        description: 'Anime player with subtitle controls'
      },
      
      vidsrc_anime_dub: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        description: 'Anime player with dub controls'
      },

      videasy_anime_sub: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        description: 'Videasy anime player with subtitle controls'
      },

      videasy_anime_dub: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'medium',
        description: 'Videasy anime player with dub controls'
      },

      vidify: {
        needsAdBlocking: true,
        allowFullControls: true,
        adBlockingLevel: 'light',
        clickjackingProtection: true,
        description: 'Light blocking for Vidify player'
      },

    };
  }

  // Get configuration for specific source
  getSourceConfig(sourceId) {
    return this.sourceConfigs[sourceId] || {
      needsAdBlocking: true,
      allowFullControls: true,
      adBlockingLevel: 'medium',
      description: 'Default configuration'
    };
  }

  // Generate CSS based on ad-blocking level
  generateAdBlockCSS(level) {
    const baseCSS = `
      /* Hide common ad containers */
      .ad, .ads, .advertisement, .banner,
      [class*="ad-"], [id*="ad-"], [class*="ads"],
      [data-ad], [data-ads] { 
        display: none !important; 
      }
    `;

    const lightCSS = `
      /* Light ad-blocking - preserve player UI */
      iframe[src*="doubleclick"],
      iframe[src*="googlesyndication"],
      div[style*="position: fixed"][style*="z-index: 999"] {
        display: none !important;
      }
    `;

    const mediumCSS = `
      /* Medium ad-blocking */
      ${lightCSS}
      .overlay:not([class*="player"]):not([class*="control"]),
      div[style*="position: absolute"][style*="z-index"][style*="width: 100%"][style*="height: 100%"]:not([class*="player"]) {
        display: none !important;
      }
    `;

    const heavyCSS = `
      /* Heavy ad-blocking */
      ${mediumCSS}
      div[style*="z-index: 2147483647"],
      div[style*="position: fixed"]:not([class*="player"]):not([class*="video"]),
      iframe:not([src*="player"]):not([src*="embed"]) {
        display: none !important;
      }
    `;

    switch (level) {
      case 'light': return baseCSS + lightCSS;
      case 'medium': return baseCSS + mediumCSS;
      case 'heavy': return baseCSS + heavyCSS;
      default: return baseCSS + mediumCSS;
    }
  }

  // Generate JavaScript for clickjacking protection
  generateClickjackingProtection() {
    return `
      (function() {
        // Prevent external redirects
        const originalOpen = window.open;
        window.open = function(url, target, features) {
          console.log('Blocked popup attempt:', url);
          return null;
        };

        // Block suspicious click events
        document.addEventListener('click', function(e) {
          const element = e.target;
          const href = element.href || element.closest('a')?.href;
          
          if (href && !href.includes(window.location.hostname)) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Blocked external redirect:', href);
          }
        }, true);

        // Remove overlay ads after content loads
        setTimeout(() => {
          const suspiciousElements = document.querySelectorAll([
            'div[style*="position: absolute"][style*="top: 0"][style*="left: 0"]',
            'div[onclick]:not([class*="player"]):not([class*="control"])',
            'a[target="_blank"]:not([href*="player"]):not([href*="embed"])'
          ].join(','));
          
          suspiciousElements.forEach(el => {
            if (el.offsetWidth > 200 && el.offsetHeight > 100) {
              el.remove();
            }
          });
        }, 2000);
      })();
    `;
  }

  // Get complete injection script for source
  getInjectionScript(sourceId) {
    const config = this.getSourceConfig(sourceId);
    
    if (!config.needsAdBlocking) {
      return ''; // No ad-blocking needed
    }

    let script = `
      // Ad-blocking CSS injection
      const style = document.createElement('style');
      style.textContent = \`${this.generateAdBlockCSS(config.adBlockingLevel)}\`;
      document.head.appendChild(style);
    `;

    if (config.clickjackingProtection) {
      script += this.generateClickjackingProtection();
    }

    return script;
  }

  // Handle API errors for sources like RidoMovies
  handleAPIError(sourceId, error) {
    const config = this.getSourceConfig(sourceId);
    
    if (config.errorHandling === 'api_fallback') {
      console.log(`${sourceId} API failed, trying fallback...`);
      return {
        shouldRetry: true,
        fallbackMessage: 'This source is temporarily unavailable. Please try another source.',
        suggestedSources: ['videasy', 'vidjoy', 'hydrahd']
      };
    }

    return {
      shouldRetry: false,
      fallbackMessage: error
    };
  }
}

// Export singleton instance
export default new AdBlocker();
