import fs from 'fs';
import path from 'path';

console.log('--- Customizing Android Native App wrapper ---');

let config = {};
try {
  const configRaw = fs.readFileSync('appnexus.config.json', 'utf8');
  config = JSON.parse(configRaw);
} catch (e) {
  console.log('No appnexus.config.json found, using defaults.');
}

const primaryColor = config.primaryColor || '#22d3ee';
const accentColor = config.accentColor || '#a855f7';
const navigationStyle = config.navigationStyle || 'bottom-nav';
const websiteUrl = config.websiteUrl || 'https://appnexus.wrapcoders.com';
const rawHideSelectors = config.hideSelectors || 'header, footer, nav, [role="navigation"], .header, .footer, .navbar, .nav-bar, .site-header, .site-footer, #header, #footer, #navbar, .menu-bar, .cookie-banner, .cookie-consent, .download-app-banner, .app-banner';
const hideSelectors = rawHideSelectors.replace(/"/g, '\\"');
const paddingBottom = navigationStyle === 'bottom-nav' ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : '0px';

// 1. Write the premium dark-mode offline error page to dist/
const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connection Offline</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.7);
      --border: rgba(255, 255, 255, 0.08);
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: ${primaryColor};
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 40px 32px;
      backdrop-filter: blur(16px);
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon-container {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(34, 211, 238, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: var(--primary);
    }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
    p { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin: 0 0 32px; }
    button {
      background: var(--primary); color: #0b0f19; border: none; padding: 14px 28px;
      border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer;
      width: 100%; transition: all 0.2s ease;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-container">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.5M5 12.5a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
      </svg>
    </div>
    <h1>Connection Error</h1>
    <p>We're unable to connect to the server. Please check your network connection and try again.</p>
    <button onclick="window.location.reload()">Retry Connection</button>
  </div>
</body>
</html>`;

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}
fs.writeFileSync('dist/error.html', errorHtml, 'utf8');
console.log('error.html written to dist/');

// 2. Enable HTTP Cleartext Traffic support in AndroidManifest.xml
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
if (fs.existsSync(manifestPath)) {
    console.log('Updating AndroidManifest.xml for HTTP cleartext traffic...');
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    if (!manifest.includes('android:usesCleartextTraffic')) {
        manifest = manifest.replace('<application', '<application android:usesCleartextTraffic="true"');
        fs.writeFileSync(manifestPath, manifest, 'utf8');
        console.log('AndroidManifest.xml successfully updated.');
    } else {
        console.log('AndroidManifest.xml already updated.');
    }
}

// 3. Find MainActivity.java and inject custom thematic styles and bottom nav
function findMainActivity(dir) {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const found = findMainActivity(fullPath);
            if (found) return found;
        } else if (file === 'MainActivity.java') {
            return fullPath;
        }
    }
    return null;
}

const mainActivityPath = findMainActivity('android/app/src/main/java');
if (mainActivityPath) {
    console.log('Found MainActivity.java at:', mainActivityPath);
    let content = fs.readFileSync(mainActivityPath, 'utf8');
    
    const packageMatch = content.match(/package\s+([^;]+);/);
    const packageName = packageMatch ? packageMatch[1] : 'com.app.appnexus';
    
    const customMainActivity = `package ${packageName};

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.Bridge;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        final Bridge currentBridge = this.bridge;
        if (currentBridge != null) {
            currentBridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    currentBridge.getWebView().setWebViewClient(new BridgeWebViewClient(currentBridge) {
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            super.onPageFinished(view, url);
                            
                            // Inject CSS to hide web headers, footers and insert theme custom colors
                            String css = "var style = document.createElement('style');" +
                                         "style.id = 'appnexus-style';" +
                                         "style.innerHTML = '" +
                                         "  ${hideSelectors} { display: none !important; } " +
                                         "  :root { " +
                                         "    --primary-color: ${primaryColor} !important; " +
                                         "    --primary: ${primaryColor} !important; " +
                                         "    --accent-color: ${accentColor} !important; " +
                                         "    --accent: ${accentColor} !important; " +
                                         "  } " +
                                         "  body { padding-bottom: ${paddingBottom} !important; } " +
                                         "';" +
                                         "document.head.appendChild(style);";
                            
                            view.evaluateJavascript(css, null);
                        }

                        @Override
                        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                            if (request.isForMainFrame()) {
                                view.loadUrl("file:///android_asset/public/error.html");
                            }
                        }
                    });
                }
            });
            
            // Inject TRUE Native Bottom Navigation Programmatically
            if ("bottom-nav".equals("${navigationStyle}")) {
                currentBridge.getWebView().post(new Runnable() {
                    @Override
                    public void run() {
                        android.view.ViewGroup parent = (android.view.ViewGroup) currentBridge.getWebView().getParent();
                        if (parent != null && parent instanceof android.widget.FrameLayout) {
                            android.widget.FrameLayout frame = (android.widget.FrameLayout) parent;
                            android.view.ViewGroup grandParent = (android.view.ViewGroup) frame.getParent();
                            if (grandParent != null) {
                                android.widget.LinearLayout linearLayout = new android.widget.LinearLayout(MainActivity.this);
                                linearLayout.setOrientation(android.widget.LinearLayout.VERTICAL);
                                linearLayout.setLayoutParams(new android.view.ViewGroup.LayoutParams(
                                    android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                                    android.view.ViewGroup.LayoutParams.MATCH_PARENT
                                ));
                                
                                grandParent.removeView(frame);
                                
                                android.widget.LinearLayout.LayoutParams frameParams = new android.widget.LinearLayout.LayoutParams(
                                    android.widget.LinearLayout.LayoutParams.MATCH_PARENT, 0, 1.0f);
                                frame.setLayoutParams(frameParams);
                                linearLayout.addView(frame);
                                
                                com.google.android.material.bottomnavigation.BottomNavigationView bottomNav = new com.google.android.material.bottomnavigation.BottomNavigationView(MainActivity.this);
                                android.widget.LinearLayout.LayoutParams navParams = new android.widget.LinearLayout.LayoutParams(
                                    android.widget.LinearLayout.LayoutParams.MATCH_PARENT, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
                                bottomNav.setLayoutParams(navParams);
                                
                                android.content.res.ColorStateList csl = android.content.res.ColorStateList.valueOf(android.graphics.Color.parseColor("${primaryColor}"));
                                bottomNav.setItemIconTintList(csl);
                                bottomNav.setItemTextColor(csl);
                                
                                android.view.Menu menu = bottomNav.getMenu();
                                menu.add(0, 1, 0, "Home").setIcon(android.R.drawable.ic_menu_compass);
                                menu.add(0, 2, 0, "Back").setIcon(android.R.drawable.ic_menu_revert);
                                menu.add(0, 3, 0, "Forward").setIcon(android.R.drawable.ic_media_next);
                                menu.add(0, 4, 0, "Reload").setIcon(android.R.drawable.ic_popup_sync);
                                
                                bottomNav.setOnItemSelectedListener(new com.google.android.material.navigation.NavigationBarView.OnItemSelectedListener() {
                                    @Override
                                    public boolean onNavigationItemSelected(android.view.MenuItem item) {
                                        WebView webView = currentBridge.getWebView();
                                        int id = item.getItemId();
                                        if (id == 1) {
                                            webView.post(() -> webView.loadUrl("${websiteUrl}"));
                                            return true;
                                        } else if (id == 2) {
                                            webView.post(() -> { if(webView.canGoBack()) webView.goBack(); });
                                            return true;
                                        } else if (id == 3) {
                                            webView.post(() -> { if(webView.canGoForward()) webView.goForward(); });
                                            return true;
                                        } else if (id == 4) {
                                            webView.post(() -> webView.reload());
                                            return true;
                                        }
                                        return false;
                                    }
                                });
                                
                                linearLayout.addView(bottomNav);
                                grandParent.addView(linearLayout);
                            }
                        }
                    }
                });
            }
        }
    }
}
`;
    
    fs.writeFileSync(mainActivityPath, customMainActivity, 'utf8');
    console.log('MainActivity.java successfully configured with Native enhancements!');
} else {
    console.error('MainActivity.java not found in project paths.');
}
console.log('--- Customization complete ---');
process.exit(0);
