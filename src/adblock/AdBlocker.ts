import * as FileSystem from 'expo-file-system';

let domainSet: Set<string> = new Set();

export async function initAdBlocker() {
  const uri = FileSystem.bundleDirectory + 'src/adblock/easylist.txt';
  const raw = await FileSystem.readAsStringAsync(uri);

  domainSet = new Set(
    raw
      .split('\\n')
      .filter(l => l.startsWith('||') && l.endsWith('^'))  // ABP host rule
      .map(l => l.slice(2, -1).trim().toLowerCase())       // ⇒ example.com
  );
}

/* small, synchronous test used in WebView callback */
export function isBlocked(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return domainSet.has(host) || domainSet.has(host.split('.').slice(-2).join('.'));
  } catch {
    return false;
  }
}
