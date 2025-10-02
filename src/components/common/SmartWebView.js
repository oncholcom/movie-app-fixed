import React, { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import AdBlocker from '../../utils/adBlocker';

const SmartWebView = ({ 
  uri, 
  sourceId, 
  onError, 
  onLoadEnd,
  htmlContent,
  style = {},
  ...rest 
}) => {
  const webViewRef = useRef(null);
  const videoPlayingRef = useRef(false);
  const adBlockerRef = useRef(new AdBlocker());

  useEffect(() => {
    if (uri && sourceId) {
      console.log(`Loading ${sourceId}: ${uri}`);
      console.log(`VIP Source: ${adBlockerRef.current.isVipSource(sourceId)}`);
      videoPlayingRef.current = false;
    }
    
    return () => {
      // Cleanup on unmount
    };
  }, [uri, sourceId, onError]);

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error(`[WebView] Error for ${sourceId}:`, nativeEvent);
    
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'webview-error',
          sourceId,
          error: nativeEvent
        })
      );
    }
    onError?.(nativeEvent.description || 'Failed to load video');
  };

  const handleHttpError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error(`[WebView] HTTP error for ${sourceId}:`, nativeEvent);
  };

  const handleLoadEnd = () => {
    console.log(`[WebView] Load end for ${sourceId} - URI: ${uri}`);
    videoPlayingRef.current = true;
    onLoadEnd?.();
  };

  // Network-level blocking script using EasyList for Premium sources
  const getNetworkBlockingScript = () => {
    const isVip = adBlockerRef.current.isVipSource(sourceId);
    
    if (isVip) {
      return `
        console.log('[AdBlocker] VIP Source detected - No ad-blocking needed for ${sourceId}');
      `;
    }
    
    return `
      (function() {
        console.log('[AdBlocker] Network-level blocking active for ${sourceId}');
        
        // Essential player domains that should never be blocked
        const playerWhitelist = [
          'vidsrc.cc', 'vidsrc.wtf', 'videasy.net', 'xprime.tv', 'nhdapi.xyz',
          'spencerdevs.xyz', 'vidrock', 'player', 'embed', 'video', 'stream',
          'cdn', 'assets', 'static', 'api', 'ajax', 'm3u8', 'mp4', 'webm'
        ];
        
        // Common ad domains from EasyList essentials
        const adDomains = [
          'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
          'google-analytics.com', 'facebook.com/tr', 'amazon-adsystem.com',
          'adsystem.com', 'ads.yahoo.com', 'adsense.com', 'adnxs.com'
        ];
        
        function isPlayerResource(url) {
          const urlLower = url.toLowerCase();
          return playerWhitelist.some(keyword => urlLower.includes(keyword));
        }
        
        function isAdDomain(url) {
          const urlLower = url.toLowerCase();
          return adDomains.some(domain => urlLower.includes(domain));
        }
        
        function shouldBlock(url) {
          // Never block player resources
          if (isPlayerResource(url)) {
            return false;
          }
          
          // Block known ad domains
          if (isAdDomain(url)) {
            console.log('[AdBlocker] BLOCKED ad domain:', url);
            return true;
          }
          
          return false;
        }
        
        // Override window.open to prevent unwanted popups and redirects
        const originalWindowOpen = window.open;
        window.open = function(url, target, features) {
          // Allow blank popups (some players use these legitimately)
          if (!url || url === 'about:blank') {
            return originalWindowOpen.call(this, url, target, features);
          }
          
          // Allow same-origin popups
          if (url.startsWith('/') || url.startsWith('./')) {
            return originalWindowOpen.call(this, url, target, features);
          }
          
          // Block external popups that are likely ads
          console.log('[AdBlocker] BLOCKED popup attempt:', url);
          return null;
        };
        
        // Override document.write to prevent ad injection
        const originalDocumentWrite = document.write;
        document.write = function(content) {
          // Block suspicious content
          if (content && (content.includes('ads') || content.includes('popup') || content.includes('redirect'))) {
            console.log('[AdBlocker] BLOCKED document.write injection');
            return;
          }
          return originalDocumentWrite.call(this, content);
        };
        
        // Add click event protection
        document.addEventListener('click', function(e) {
          const target = e.target;
          const href = target.href || target.getAttribute('href');
          
          if (href) {
            // Block suspicious click targets
            const suspiciousPatterns = [
              /\/\/.*\.(tk|ml|ga|cf)\//i,
              /\/\/.*ads.*\//i,
              /\/\/.*redirect.*\//i,
              /[?&]popup=/i,
              /[?&]click=/i
            ];
            
            if (suspiciousPatterns.some(pattern => pattern.test(href))) {
              console.log('[AdBlocker] BLOCKED suspicious click:', href);
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }
        }, true);
        
        console.log('[AdBlocker] Network blocking initialized for ${sourceId}');
      })();
    `;
  };

  // Complete injection script combining video detection and network blocking
  const injectionScript = `
    (function() {
      console.log('SmartWebView script loaded for ${sourceId}');
      
      // Video detection functionality
      function checkVideoPlaying() {
        const videos = document.querySelectorAll('video');
        for (let video of videos) {
          if (video.readyState >= 2 && (video.currentTime > 0 || video.duration > 0)) {
            console.log('Video detected as playing');
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'video-playing',
                sourceId: '${sourceId}'
              }));
            }
            return true;
          }
        }
        return false;
      }
      
      // Monitor for video events
      document.addEventListener('play', function(e) {
        if (e.target.tagName === 'VIDEO') {
          console.log('Video play event detected');
          checkVideoPlaying();
        }
      }, true);
      
      document.addEventListener('loadeddata', function(e) {
        if (e.target.tagName === 'VIDEO') {
          console.log('Video loadeddata event detected');
          checkVideoPlaying();
        }
      }, true);
      
      console.log('Video detection script loaded for ${sourceId}');
    })();
    
    // Network blocking for non-VIP sources
    ${getNetworkBlockingScript()}
  `;

  // Enhanced navigation handler with click hijacking protection
  const onShouldStartLoadWithRequest = (event) => {
    const { url, navigationType } = event;
    console.log(`[WebView] Navigation request: ${url}`, `Type: ${navigationType}`);
    
    // Always allow the initial page load
    if (!uri || url === uri) {
      console.log(`[WebView] Allowing initial page load: ${url}`);
      return true;
    }
    
    // Block click hijacking - common patterns that try to redirect users
    const hijackingPatterns = [
      // Ad redirects
      /\/\/.*\.(click|redirect|go)\//i,
      /\/\/.*\/(redirect|redir|go|click|out)\?/i,
      /\/\/.*\/\?.*redirect/i,
      /\/\/.*\/\?.*url=/i,
      
      // Suspicious domains
      /\/\/.*\.(tk|ml|ga|cf)\//i,
      /\/\/bit\.ly\//i,
      /\/\/tinyurl\./i,
      /\/\/short\./i,
      
      // Ad networks trying to open browsers
      /\/\/.*ads.*\//i,
      /\/\/.*advert.*\//i,
      /\/\/.*banner.*\//i,
      /\/\/.*popup.*\//i,
      
      // Common ad redirect parameters
      /[?&](popup|redirect|external|click|ad)=/i,
      /[?&]url=http/i
    ];
    
    // Check if URL matches hijacking patterns
    const isHijacking = hijackingPatterns.some(pattern => pattern.test(url));
    if (isHijacking) {
      console.log(`[AdBlocker] 🚫 BLOCKED Click Hijacking: ${url}`);
      return false;
    }
    
    // Block if URL should be blocked by EasyList (ad networks)
    if (adBlockerRef.current.shouldBlockUrl(url, 'navigation', sourceId, uri)) {
      console.log(`[AdBlocker] 🚫 BLOCKED Ad Navigation: ${url}`);
      return false;
    }
    
    // Allow legitimate video player navigation (iframe content, player APIs)
    const legitimatePatterns = [
      // Player domains
      /vidsrc\.(cc|wtf|net)/i,
      /videasy\.net/i,
      /xprime\.tv/i,
      /nhdapi\.xyz/i,
      /spencerdevs\.xyz/i,
      /vidrock/i,
      
      // Player resources
      /\/(player|embed|video|stream|api)\//i,
      /\.(m3u8|mp4|webm|mkv|avi)($|\?)/i,
      
      // Same origin navigation
      new RegExp(`^${uri.replace(/\/[^/]*$/, '')}`)
    ];
    
    const isLegitimate = legitimatePatterns.some(pattern => pattern.test(url));
    if (isLegitimate) {
      console.log(`[WebView] ✅ Allowing legitimate navigation: ${url}`);
      return true;
    }
    
    // Block all other external navigation to prevent leaving the app
    console.log(`[AdBlocker] 🚫 BLOCKED External Navigation: ${url}`);
    return false;
  };

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log(`[WebView] Message from ${sourceId}:`, data);
      
      if (data.type === 'video-playing') {
        console.log(`[WebView] Video is playing for ${sourceId}`);
        videoPlayingRef.current = true;
      }
    } catch (error) {
      console.log(`[WebView] Error parsing message from ${sourceId}:`, error);
    }
  };

  // Clean headers
  let customHeaders = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
  };

  return (
    <WebView
      ref={webViewRef}
      source={htmlContent ? {
        html: htmlContent
      } : {
        uri,
        headers: customHeaders
      }}
      style={[{ flex: 1, backgroundColor: 'transparent' }, style]}
      // Enable all necessary features for video players
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowsFullscreenVideo={true}
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback={true}
      // Inject video detection + network blocking
      injectedJavaScript={injectionScript}
      // Error handling
      onError={handleError}
      onHttpError={handleHttpError}
      onLoadEnd={handleLoadEnd}
      onMessage={handleMessage}
      // Network-level blocking
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      // Additional props for compatibility
      mixedContentMode="always"
      originWhitelist={['*']}
      startInLoadingState={true}
      scalesPageToFit={true}
      bounces={false}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
      sharedCookiesEnabled={true}
      // Debug logging
      onLoadStart={() => {
        console.log(`WebView load started for ${sourceId}: ${uri}`);
      }}
      onLoadProgress={({ nativeEvent }) => console.log(`WebView load progress: ${nativeEvent.progress * 100}%`)}
      
      {...rest}
    />
  );
};

export default SmartWebView;