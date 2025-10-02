// Test script to verify iframe rendering for premium sources
// Run this in a browser console when testing video sources

console.log('Testing iframe rendering for premium sources...');

// Test for common iframe issues
function testIframeRendering() {
  const iframes = document.querySelectorAll('iframe');
  console.log(`Found ${iframes.length} iframes`);
  
  iframes.forEach((iframe, index) => {
    console.log(`Iframe ${index + 1}:`);
    console.log(`  - src: ${iframe.src}`);
    console.log(`  - width: ${iframe.style.width || iframe.width || 'auto'}`);
    console.log(`  - height: ${iframe.style.height || iframe.height || 'auto'}`);
    console.log(`  - display: ${window.getComputedStyle(iframe).display}`);
    console.log(`  - visibility: ${window.getComputedStyle(iframe).visibility}`);
    console.log(`  - opacity: ${window.getComputedStyle(iframe).opacity}`);
    console.log(`  - allowfullscreen: ${iframe.hasAttribute('allowfullscreen')}`);
    console.log(`  - allow: ${iframe.getAttribute('allow')}`);
    
    // Test if iframe is blocked by overlays
    const rect = iframe.getBoundingClientRect();
    const elementAtPoint = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
    if (elementAtPoint !== iframe && !iframe.contains(elementAtPoint)) {
      console.log(`  - WARNING: Iframe may be covered by overlay: ${elementAtPoint?.tagName}`);
    }
  });
  
  // Check for blocking overlays
  const overlays = document.querySelectorAll('div[style*="position: fixed"], div[style*="position: absolute"]');
  console.log(`Found ${overlays.length} positioned elements (potential overlays)`);
  
  overlays.forEach((overlay, index) => {
    const style = window.getComputedStyle(overlay);
    if (parseInt(style.zIndex) > 100) {
      console.log(`Overlay ${index + 1} with high z-index (${style.zIndex}):`);
      console.log(`  - display: ${style.display}`);
      console.log(`  - size: ${style.width} x ${style.height}`);
      console.log(`  - position: ${style.top}, ${style.left}`);
      
      if (!overlay.querySelector('video') && !overlay.querySelector('iframe')) {
        console.log(`  - WARNING: High z-index overlay without video/iframe content`);
      }
    }
  });
}

// Run test immediately
testIframeRendering();

// Set up periodic test to monitor changes
let testInterval = setInterval(() => {
  console.log('--- Periodic iframe test ---');
  testIframeRendering();
}, 5000);

// Stop monitoring after 30 seconds
setTimeout(() => {
  clearInterval(testInterval);
  console.log('Iframe monitoring stopped');
}, 30000);

// Test premium source specific issues
function testPremiumSources() {
  const knownPremiumDomains = [
    'vidjoy.pro',
    'hydrahd.net', 
    'ridomovies.com',
    'vidlink.to',
    'vidsrc.cc',
    'xprime.tv',
    'videasy.net'
  ];
  
  const currentDomain = window.location.hostname;
  const isPremiumSource = knownPremiumDomains.some(domain => currentDomain.includes(domain));
  
  console.log(`Current domain: ${currentDomain}`);
  console.log(`Is premium source: ${isPremiumSource}`);
  
  if (isPremiumSource) {
    console.log('Running premium source specific tests...');
    
    // Check for ad containers that might interfere
    const adSelectors = ['.ad', '.ads', '.advertisement', '.banner', '[class*="ad-"]'];
    adSelectors.forEach(selector => {
      const ads = document.querySelectorAll(selector);
      if (ads.length > 0) {
        console.log(`Found ${ads.length} potential ad elements with selector: ${selector}`);
      }
    });
    
    // Check video elements
    const videos = document.querySelectorAll('video');
    console.log(`Found ${videos.length} video elements`);
    videos.forEach((video, index) => {
      console.log(`Video ${index + 1}:`);
      console.log(`  - autoplay: ${video.autoplay}`);
      console.log(`  - controls: ${video.controls}`);
      console.log(`  - muted: ${video.muted}`);
      console.log(`  - paused: ${video.paused}`);
      console.log(`  - ready state: ${video.readyState}`);
    });
  }
}

testPremiumSources();

console.log('Iframe test script loaded. Check console for results.');