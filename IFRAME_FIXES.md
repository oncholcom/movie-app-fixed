# Premium Video Source Iframe Rendering Fixes

## Issues Identified

Premium video sources like VidJoy, HydraHD, RidoMovies, VidLink, VidSrc, etc. were experiencing iframe rendering problems where:

1. **Iframes not displaying properly** - Missing or incorrect iframe attributes
2. **Ad-blocking interference** - Over-aggressive ad-blocking hiding embed iframes
3. **Missing iframe optimization** - No specific handling for embed-type sources
4. **Overlay blocking** - Ad overlays covering video players
5. **Inconsistent allowfullscreen attributes** - Not all iframes had proper fullscreen support

## Solutions Implemented

### 1. SmartWebView Component Enhancements (`src/components/common/SmartWebView.js`)

Added comprehensive iframe optimization for premium sources:

```javascript
// Premium sources iframe optimization script
const premiumSources = ['vidjoy', 'hydrahd', 'ridomovies', 'vidlink', 'vidsrc', 'vidsrc_v3', 'xprime', 'vidrock', 'spencerdevs', 'videasy'];
const tmdbPremiumSources = ['tmdb_vidjoy_premium', 'tmdb_hydrahd_premium', ...];
```

**Key improvements:**
- Automatic iframe attribute configuration (allowfullscreen, allow, frameborder)
- Dynamic iframe detection and optimization
- Overlay removal while preserving player controls
- Responsive CSS injection for proper iframe sizing
- Enhanced video autoplay handling

### 2. AdBlocker Configuration Updates (`src/utils/adBlocker.js`)

Updated ad-blocking configurations to be iframe-friendly:

**Changes made:**
- Reduced ad-blocking levels from 'medium' to 'light' for premium sources
- Added `iframeOptimization: true` flag for premium sources
- Disabled aggressive `clickjackingProtection` for embed sources
- Modified CSS selectors to preserve iframe functionality

**New CSS approach:**
```css
/* Hide ads but preserve iframes */
.ad:not(iframe), .ads:not(iframe), .advertisement:not(iframe) { 
  display: none !important; 
}

/* Ensure iframes are properly displayed */
iframe {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
```

### 3. Premium Source Specific Optimizations

Each premium source now has optimized settings:

- **VidJoy**: Light ad-blocking with iframe optimization
- **HydraHD**: No ad-blocking (already clean) with iframe optimization  
- **RidoMovies**: API-based handling with iframe optimization
- **VidLink/VidSrc/XPrime**: Light ad-blocking with iframe optimization
- **Videasy**: Light ad-blocking, disabled clickjacking protection

### 4. Dynamic Iframe Detection

Added mutation observer to detect dynamically loaded iframes:

```javascript
// Check for dynamically loaded content
const observer = new MutationObserver(function(mutations) {
  // Automatically configure new iframes as they appear
});
```

## Testing

Use the included `iframe-test.js` script to verify fixes:

1. Load the script in browser console when testing video sources
2. Monitor iframe attributes and potential blocking elements
3. Check for proper video playback initialization

## Expected Results

After these fixes, premium sources should:

✅ **Properly render iframes** with correct dimensions
✅ **Support fullscreen mode** with allowfullscreen attributes  
✅ **Have minimal ad-blocking interference** 
✅ **Automatically configure video elements** for playback
✅ **Remove blocking overlays** while preserving controls
✅ **Handle dynamic content loading** for complex players

## Specific Sources Improved

- **VidJoy** (`vidjoy.pro`) - Better iframe handling, reduced ad-blocking
- **HydraHD** (`hydrahd.net`) - Optimized for clean embed rendering
- **RidoMovies** (`ridomovies.com`) - API fallback with iframe optimization
- **VidLink** (`vidlink.to`) - Light ad-blocking for embed players
- **VidSrc** (`vidsrc.cc`) - Enhanced player control preservation  
- **XPrime** (`xprime.tv`) - Optimized embed handling
- **VidRock/SpencerDevs** - Light ad-blocking with iframe optimization
- **All TMDB Premium sources** - Anime-specific optimizations

## Monitoring

The fixes include console logging to help debug any remaining issues:

```javascript
console.log('Optimizing iframe for premium source: ${sourceId}');
console.log('Iframe configured:', iframe.src);
console.log('Removed blocking overlay');
```

Check browser console for these messages when troubleshooting specific sources.