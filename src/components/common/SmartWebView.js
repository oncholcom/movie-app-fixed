import React, { useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { isBlocked } from '../../adblock/AdBlocker';
import adBlocker from '../../utils/adBlocker';

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
  const config = adBlocker.getSourceConfig(sourceId);
  const videoPlayingRef = useRef(false);

  useEffect(() => {
    if (uri && sourceId) {
      console.log(`Loading ${sourceId}:`, config.description);
      console.log(`WebView URI: ${uri}`);
      
      // Reset video playing state
      videoPlayingRef.current = false;
      
      // No timeout - let videos load naturally
      console.log(`No timeout set for ${sourceId} - allowing natural loading`);
    }
    
          return () => {
            // Cleanup on unmount
          };
  }, [uri, sourceId, onError]);

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error(`[WebView] Error for ${sourceId}:`, nativeEvent);
    console.error(`[WebView] Error details:`, {
      code: nativeEvent.code,
      description: nativeEvent.description,
      url: nativeEvent.url,
      domain: nativeEvent.domain
    });
    
    // No timeout to clear
    
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
    if (typeof window !== 'undefined' && window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'webview-http-error',
          sourceId,
          error: nativeEvent
        })
      );
    }
  };

  const handleLoadEnd = () => {
    console.log(`[WebView] Load end for ${sourceId} - URI: ${uri}`);
    
    // Mark video as ready when WebView loads to 100%
    if (sourceId === 'nontongo' || sourceId === 'mappletv') {
      console.log(`[WebView] ${sourceId} loaded successfully`);
      videoPlayingRef.current = true;
    }
    
    if (onLoadEnd) {
      onLoadEnd();
    }
  };

  // Get injection script based on source configuration
  const injectionScript = adBlocker.getInjectionScript(sourceId);

  // Additional injected JS to disable window.open and remove target=_blank
  const disablePopupsScript = `
    window.open = () => null;
    document.querySelectorAll('a[target=_blank]').forEach(a => a.removeAttribute('target'));
    true;
  `;

  // Video detection script with autoplay
  const videoDetectionScript = `
    (function() {
      let videoPlaying = false;
      let autoplayAttempted = false;
      
      function enableAutoplay() {
        const videos = document.querySelectorAll('video');
        videos.forEach(function(video) {
          // Enable autoplay attributes
          video.setAttribute('autoplay', 'true');
          video.setAttribute('muted', 'true');
          video.setAttribute('playsinline', 'true');
          video.setAttribute('webkit-playsinline', 'true');
          
          // Try to play the video
          if (video.paused) {
            video.play().then(function() {
              console.log('Video autoplay started successfully');
              video.muted = false; // Unmute after starting
            }).catch(function(error) {
              console.log('Autoplay failed, trying muted:', error);
              video.muted = true;
              video.play().then(function() {
                console.log('Muted autoplay started');
                // Unmute after a short delay
                setTimeout(function() {
                  video.muted = false;
                }, 1000);
              }).catch(function(err) {
                console.log('Muted autoplay also failed:', err);
              });
            });
          }
        });
      }
      
      function checkVideoPlaying() {
        const videos = document.querySelectorAll('video');
        for (let video of videos) {
          if (video.readyState >= 2 && (video.currentTime > 0 || video.duration > 0)) {
            if (!videoPlaying) {
              videoPlaying = true;
              console.log('Video detected as playing');
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'video-playing',
                  sourceId: '${sourceId}'
                }));
              }
            }
            return true;
          }
        }
        return false;
      }
      
      // Start monitoring immediately
      
      // Try autoplay immediately
      setTimeout(function() {
        enableAutoplay();
        autoplayAttempted = true;
      }, 1000);
      
      // Also monitor for video elements being added
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length > 0) {
            for (let node of mutation.addedNodes) {
              if (node.nodeType === 1) { // Element node
                if (node.tagName === 'VIDEO' || node.querySelector('video')) {
                  console.log('Video element detected, starting monitoring and autoplay');
                  if (!autoplayAttempted) {
                    enableAutoplay();
                    autoplayAttempted = true;
                  }
                }
              }
            }
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Listen for video events
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
          // Try autoplay when video data is loaded
          if (!autoplayAttempted) {
            enableAutoplay();
            autoplayAttempted = true;
          }
        }
      }, true);
      
      document.addEventListener('canplay', function(e) {
        if (e.target.tagName === 'VIDEO') {
          console.log('Video canplay event detected');
          checkVideoPlaying();
          // Try autoplay when video can play
          if (!autoplayAttempted) {
            enableAutoplay();
            autoplayAttempted = true;
          }
        }
      }, true);
      
      document.addEventListener('loadedmetadata', function(e) {
        if (e.target.tagName === 'VIDEO') {
          console.log('Video loadedmetadata event detected');
          // Try autoplay when video metadata is loaded
          if (!autoplayAttempted) {
            enableAutoplay();
            autoplayAttempted = true;
          }
        }
      }, true);
      
      // Periodic autoplay check for videos that might not trigger events
      setInterval(function() {
        const videos = document.querySelectorAll('video');
        if (videos.length > 0 && !autoplayAttempted) {
          console.log('Found videos, attempting autoplay');
          enableAutoplay();
          autoplayAttempted = true;
        }
      }, 3000); // Check every 3 seconds
      
      console.log('Video detection script with autoplay loaded for ${sourceId}');
    })();
  `;

  // Custom responsive CSS for uembed_dubbed
  let responsiveCSS = '';
  if (sourceId === 'uembed_dubbed') {
    responsiveCSS = `
      (function() {
        var style = document.createElement('style');
        style.innerHTML = \`
          html, body {
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: transparent !important;
          }
          video {
            width: 100vw !important;
            height: 100vh !important;
            object-fit: contain !important;
          }
          /* Remove any dark overlays that might cover controls */
          .overlay, .dark-overlay, .background-overlay, .black-overlay, .dark-bg, .top-overlay, .header-overlay, .control-overlay {
            display: none !important;
          }
          /* Ensure video player doesn't have dark backgrounds */
          .player, .video-player, .player-container, .video-container, .video-wrapper, .player-wrapper {
            background: transparent !important;
          }
          /* Remove any fixed positioned dark elements */
          [style*="background: black"], [style*="background-color: black"], [style*="background: #000"], [style*="background-color: #000"] {
            background: transparent !important;
          }
          /* Remove any elements with dark backgrounds in top area */
          div[style*="position: fixed"], div[style*="position: absolute"] {
            background: transparent !important;
          }
          /* Specifically target top area overlays */
          body > div:first-child, html > body > div:first-child {
            background: transparent !important;
          }
          /* Force transparency on any element in top 100px */
          * {
            background: transparent !important;
          }
          /* But allow video elements to keep their background */
          video, iframe, object, embed {
            background: #000 !important;
          }
        \`;
        document.head.appendChild(style);
      })();
    `;
  } else if (sourceId === 'vidify') {
    responsiveCSS = `
      (function() {
        var style = document.createElement('style');
        style.innerHTML = \`
          html, body {
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #000 !important;
          }
          iframe {
            width: 100vw !important;
            height: 100vh !important;
            border: none !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          video {
            width: 100vw !important;
            height: 100vh !important;
            object-fit: contain !important;
          }
          /* Remove any blocking overlays */
          div[style*="position: fixed"]:not([class*="player"]):not([class*="video"]) {
            display: none !important;
          }
        \`;
       document.head.appendChild(style);
     })();
   `;
 } else if (sourceId === 'vidsrc_wtf_1') {
   responsiveCSS = `
     (function() {
       var style = document.createElement('style');
       style.innerHTML = \`
         html, body {
           width: 100vw !important;
           height: 100vh !important;
           margin: 0 !important;
           padding: 0 !important;
           overflow: hidden !important;
           background: #000 !important;
         }
         iframe {
           width: 100vw !important;
           height: 100vh !important;
           border: none !important;
           position: absolute !important;
           top: 0 !important;
           left: 0 !important;
         }
         video {
           width: 100vw !important;
           height: 100vh !important;
           object-fit: contain !important;
         }
         /* Remove any blocking overlays */
         div[style*="position: fixed"]:not([class*="player"]):not([class*="video"]) {
           display: none !important;
         }
       \`;
       document.head.appendChild(style);
     })();
   `;
 }

 // Unmute script for uembed_dubbed
  let unmuteScript = '';
  if (sourceId === 'uembed_dubbed') {
    unmuteScript = `
      setTimeout(function() {
        var v = document.querySelector('video');
        if (v) {
          v.muted = false;
          v.volume = 1.0;
          v.play();
        }
      }, 1000);
      
      // Remove any dark overlays that might cover controls
      function removeDarkOverlays() {
        // Remove by class names
        var overlays = document.querySelectorAll('.overlay, .dark-overlay, .background-overlay, .black-overlay, .dark-bg, .top-overlay, .header-overlay, .control-overlay');
        overlays.forEach(function(overlay) {
          overlay.style.display = 'none';
          overlay.remove();
        });
        
        // Remove by inline styles
        var darkElements = document.querySelectorAll('[style*="background: black"], [style*="background-color: black"], [style*="background: #000"], [style*="background-color: #000"]');
        darkElements.forEach(function(element) {
          if (element.style.position === 'fixed' || element.style.position === 'absolute') {
            element.style.display = 'none';
            element.remove();
          }
        });
        
        // Remove any divs with dark backgrounds in top area
        var allDivs = document.querySelectorAll('div');
        allDivs.forEach(function(div) {
          var computedStyle = window.getComputedStyle(div);
          if ((computedStyle.position === 'fixed' || computedStyle.position === 'absolute') && 
              (computedStyle.backgroundColor === 'rgb(0, 0, 0)' || 
               computedStyle.backgroundColor === 'black' ||
               div.style.backgroundColor === 'black' ||
               div.style.backgroundColor === '#000')) {
            div.style.display = 'none';
            div.remove();
          }
        });
      }
      
      // Run immediately and periodically
      removeDarkOverlays();
      setInterval(removeDarkOverlays, 2000);
      
      // Additional aggressive removal for top area dark overlays
      function removeTopDarkOverlays() {
        // Target any element in the top 100px that has dark background
        var allElements = document.querySelectorAll('*');
        allElements.forEach(function(element) {
          var rect = element.getBoundingClientRect();
          if (rect.top < 100 && rect.height > 0) { // Top 100px area
            var style = window.getComputedStyle(element);
            if (style.position === 'fixed' || style.position === 'absolute') {
              if (style.backgroundColor === 'rgb(0, 0, 0)' || 
                  style.backgroundColor === 'black' ||
                  element.style.backgroundColor === 'black' ||
                  element.style.backgroundColor === '#000' ||
                  element.style.backgroundColor === 'rgba(0, 0, 0, 0.8)' ||
                  element.style.backgroundColor === 'rgba(0, 0, 0, 0.9)') {
                element.style.display = 'none';
                element.remove();
              }
            }
          }
        });
      }
      
      // Run top overlay removal more frequently
      removeTopDarkOverlays();
      setInterval(removeTopDarkOverlays, 1000);
      
      true;
    `;
  }
  
  // Vidify specific script
  let vidifyScript = '';
  if (sourceId === 'vidify') {
    vidifyScript = `
      // Vidify specific fixes
      setTimeout(function() {
        // Ensure vidify player loads properly
        var iframes = document.querySelectorAll('iframe');
        iframes.forEach(function(iframe) {
          if (iframe.src.includes('vidify') || iframe.src.includes('player')) {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('allow', 'autoplay; fullscreen');
          }
        });
        
        // Remove any blocking overlays
        var overlays = document.querySelectorAll('div[style*="position: fixed"], div[style*="position: absolute"]');
        overlays.forEach(function(overlay) {
          if (overlay.style.zIndex > 1000 && !overlay.querySelector('video') && !overlay.querySelector('iframe')) {
            overlay.style.display = 'none';
          }
        });
        
        // Force video autoplay for vidify
        var videos = document.querySelectorAll('video');
        videos.forEach(function(video) {
          video.setAttribute('autoplay', 'true');
          video.setAttribute('muted', 'true');
          video.setAttribute('playsinline', 'true');
          video.play().catch(function(e) {
            console.log('Vidify autoplay failed:', e);
          });
        });
      }, 2000);
      
      true;
    `;
  }

  // VidSrc API v1 specific script
  let vidsrcWtfScript = '';
  if (sourceId === 'vidsrc_wtf_1') {
    vidsrcWtfScript = `
      // VidSrc API v1 specific fixes
      setTimeout(function() {
        // Ensure iframe loads properly
        var iframes = document.querySelectorAll('iframe');
        iframes.forEach(function(iframe) {
          if (iframe.src.includes('vidsrc') || iframe.src.includes('embed')) {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('allow', 'autoplay; fullscreen');
          }
        });
        
        // Remove any blocking overlays
        var overlays = document.querySelectorAll('div[style*="position: fixed"], div[style*="position: absolute"]');
        overlays.forEach(function(overlay) {
          if (overlay.style.zIndex > 1000 && !overlay.querySelector('video') && !overlay.querySelector('iframe')) {
            overlay.style.display = 'none';
          }
        });

        // Force video autoplay for vidsrc
        var videos = document.querySelectorAll('video');
        videos.forEach(function(video) {
          video.setAttribute('autoplay', 'true');
          video.setAttribute('muted', 'true');
          video.setAttribute('playsinline', 'true');
          video.play().catch(function(e) {
            console.log('VidSrc autoplay failed:', e);
          });
        });
      }, 2000);
      
      true;
    `;
  }

  // Combine scripts
  const combinedScript = videoDetectionScript + (unmuteScript || vidifyScript || vidsrcWtfScript || disablePopupsScript);

  const onShouldStartLoadWithRequest = (event) => {
    console.log(`[WebView] Navigation attempt:`, {
      url: event.url,
      navigationType: event.navigationType,
      mainDocumentURL: event.mainDocumentURL,
      lockIdentifier: event.lockIdentifier,
      method: event.method,
      isTopFrame: event.isTopFrame,
      sourceId,
    });
    // Allow about:blank for SmashyStream
    if (sourceId === 'smashy' && event.url === 'about:blank') {
      console.log('[WebView] Allowing navigation to about:blank for SmashyStream');
      return true;
    }
    
    // Allow vidify navigation
    if (sourceId === 'vidify' && (
      event.url.includes('vidify.top') || 
      event.url.includes('vidify') ||
      event.navigationType === 'other'
    )) {
      console.log('[WebView] Allowing vidify navigation:', event.url);
      return true;
    }
    
    // Allow vidsrc.wtf navigation for VidSrc API v1
    if (sourceId === 'vidsrc_wtf_1' && (
      event.url.includes('vidsrc.wtf') || 
      event.url.includes('vidsrc') ||
      event.navigationType === 'other'
    )) {
      console.log('[WebView] Allowing vidsrc.wtf navigation:', event.url);
      return true;
    }
    if (isBlocked(event.url) || event.navigationType !== 'other') {
      console.log(`[WebView] Blocked navigation to: ${event.url} (type: ${event.navigationType})`);
      return false; // Cancel the request
    }
    return true; // Allow inside-frame requests
  };

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log(`[WebView] Message from ${sourceId}:`, data);
      
      if (data.type === 'video-playing') {
        console.log(`[WebView] Video is playing for ${sourceId}`);
        videoPlayingRef.current = true;
      } else if (data.type === 'page-loaded' && (sourceId === 'nontongo' || sourceId === 'mappletv')) {
        // For these sources, consider page loaded as video ready since they load correctly
        console.log(`[WebView] ${sourceId} page loaded - considering video ready`);
        videoPlayingRef.current = true;
      }
    } catch (error) {
      console.log(`[WebView] Error parsing message from ${sourceId}:`, error);
    }
  };

  // Determine headers based on sourceId
  let customHeaders = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9,bn;q=0.8',
    'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
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
      // Inject ad-blocking script if needed
      injectedJavaScriptBeforeContentLoaded={responsiveCSS || injectionScript}
      // Inject script for video detection and other functionality
      injectedJavaScript={combinedScript}
      // Error handling
      onError={handleError}
      onHttpError={handleHttpError}
      onLoadEnd={handleLoadEnd}
      onMessage={handleMessage}

      // Block navigation to ad domains and external links
      onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
      // Additional props for better compatibility and security
      mixedContentMode="always"
      originWhitelist={['*']}
      setSupportMultipleWindows={false}
      startInLoadingState={true}
      scalesPageToFit={true}
      bounces={false}
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      // User agent for better compatibility
      userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36"
      sharedCookiesEnabled={true}
      // Additional debugging
      onLoadStart={() => {
        console.log(`WebView load started for ${sourceId}: ${uri}`);
        console.log(`htmlContent provided: ${htmlContent ? 'YES' : 'NO'}`);
        if (htmlContent) {
          console.log(`htmlContent length: ${htmlContent.length}`);
        }
      }}
      onLoadProgress={({ nativeEvent }) => console.log(`WebView load progress: ${nativeEvent.progress * 100}%`)}
      
      {...rest}
    />
  );
};

export default SmartWebView;
