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
const hideSelectors = config.hideSelectors || 'header, footer, nav, [role="navigation"], .header, .footer, .navbar, .nav-bar, .site-header, .site-footer, #header, #footer, #navbar, .menu-bar, .cookie-banner, .cookie-consent, .download-app-banner, .app-banner';
const paddingBottom = navigationStyle === 'bottom-nav' ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : '0px';

const customCSS = config.customCSS || '';
const customJS = config.customJS || '';

const navigationItems = config.navigationItems || [
  { label: 'Home', icon: 'ic_menu_compass', action: 'home' },
  { label: 'Back', icon: 'ic_menu_revert', action: 'back' },
  { label: 'Forward', icon: 'ic_media_next', action: 'forward' },
  { label: 'Reload', icon: 'ic_popup_sync', action: 'reload' }
];

let menuJava = '';
let listenerJava = '';

navigationItems.forEach((item, index) => {
  const itemId = index + 1;
  menuJava += `                                menu.add(0, ${itemId}, 0, "${item.label}").setIcon(getResources().getIdentifier("${item.icon || 'ic_menu_info_details'}", "drawable", "android"));\n`;
  
  if (item.url) {
      listenerJava += `                                        } else if (id == ${itemId}) {\n                                            webView.post(() -> webView.loadUrl("${item.url}"));\n                                            return true;\n`;
  } else if (item.action === 'back') {
      listenerJava += `                                        } else if (id == ${itemId}) {\n                                            webView.post(() -> { if(webView.canGoBack()) webView.goBack(); });\n                                            return true;\n`;
  } else if (item.action === 'forward') {
      listenerJava += `                                        } else if (id == ${itemId}) {\n                                            webView.post(() -> { if(webView.canGoForward()) webView.goForward(); });\n                                            return true;\n`;
  } else if (item.action === 'reload') {
      listenerJava += `                                        } else if (id == ${itemId}) {\n                                            webView.post(() -> webView.reload());\n                                            return true;\n`;
  } else {
      listenerJava += `                                        } else if (id == ${itemId}) {\n                                            webView.post(() -> webView.loadUrl("${websiteUrl}"));\n                                            return true;\n`;
  }
});

// To handle the first 'if' correctly:
listenerJava = listenerJava.replace('} else if', 'if');

let urlMatcherJava = '';
navigationItems.forEach((item, index) => {
    const itemId = index + 1;
    if (item.url) {
        urlMatcherJava += `                    if (url.contains("${item.url}")) { bottomNav.getMenu().findItem(${itemId}).setChecked(true); return; }\n`;
    } else if (item.action === 'home') {
        urlMatcherJava += `                    if (url.equals("${websiteUrl}") || url.equals("${websiteUrl}/")) { bottomNav.getMenu().findItem(${itemId}).setChecked(true); return; }\n`;
    }
});

const cssPayload = `
  ${hideSelectors} { display: none !important; }
  :root {
    --primary-color: ${primaryColor} !important;
    --primary: ${primaryColor} !important;
    --accent-color: ${accentColor} !important;
    --accent: ${accentColor} !important;
  }
  body { 
    padding-bottom: ${paddingBottom} !important;
    padding-top: env(safe-area-inset-top) !important;
    overscroll-behavior-y: none !important;
    -webkit-tap-highlight-color: transparent !important;
    -webkit-touch-callout: none !important;
    user-select: none !important;
  }
  input, textarea, [contenteditable] {
    user-select: auto !important;
    -webkit-touch-callout: default !important;
  }
  ${customCSS}
`;

const cssBase64 = Buffer.from(cssPayload).toString('base64');
const jsBase64 = Buffer.from(customJS).toString('base64');

const syncScript = `
  const notifyNav = () => {
    if (window.AppnexusBridge) {
      window.AppnexusBridge.onUrlChange(window.location.href);
    }
  };
  const originalPushState = history.pushState;
  if (originalPushState) {
      history.pushState = function() {
        originalPushState.apply(this, arguments);
        notifyNav();
      };
  }
  const originalReplaceState = history.replaceState;
  if (originalReplaceState) {
      history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        notifyNav();
      };
  }
  window.addEventListener('popstate', notifyNav);
  setTimeout(notifyNav, 500); // trigger on load
  
  // Biometric Auth Interceptor
  document.addEventListener('submit', (e) => {
    const form = e.target;
    const passwordInput = form.querySelector('input[type="password"]');
    if (passwordInput) {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BiometricAuth) {
         window.Capacitor.Plugins.BiometricAuth.checkBiometry().then((info) => {
             if (info.isAvailable) {
                 window.Capacitor.Plugins.BiometricAuth.authenticate({ reason: "Save credentials for auto-login" });
             }
         });
      }
    }
  });

  // Haptic Feedback Micro-interactions
  document.addEventListener('click', (e) => {
    if (e.target.closest('button, a, [role="button"]')) {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
        window.Capacitor.Plugins.Haptics.impact({ style: 'Light' });
      }
    }
  });
`;
const syncBase64 = Buffer.from(syncScript).toString('base64');

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
    
    class AppnexusJSInterface {
        private com.google.android.material.bottomnavigation.BottomNavigationView bottomNav;
        public AppnexusJSInterface(com.google.android.material.bottomnavigation.BottomNavigationView nav) {
            this.bottomNav = nav;
        }

        @android.webkit.JavascriptInterface
        public void onUrlChange(String url) {
            MainActivity.this.runOnUiThread(new Runnable() {
                @Override
                public void run() {
${urlMatcherJava}
                }
            });
        }
    }

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
                            String cssBase64 = "${cssBase64}";
                            String injectCssJs = "var style = document.createElement('style');" +
                                         "style.id = 'appnexus-style';" +
                                         "style.innerHTML = atob('" + cssBase64 + "');" +
                                         "document.head.appendChild(style);";
                            
                            view.evaluateJavascript(injectCssJs, null);

                            // Inject AI Custom JS
                            String jsBase64 = "${jsBase64}";
                            if (!jsBase64.trim().isEmpty()) {
                                String injectJs = "try { eval(decodeURIComponent(escape(atob('" + jsBase64 + "')))); } catch(e) { console.error('AI Injection Error:', e); }";
                                view.evaluateJavascript(injectJs, null);
                            }

                            // Inject Bidirectional Sync JS
                            String syncBase64 = "${syncBase64}";
                            String syncJs = "try { eval(decodeURIComponent(escape(atob('" + syncBase64 + "')))); } catch(e) {}";
                            view.evaluateJavascript(syncJs, null);

                            // Stop SwipeRefreshLayout spinner if refreshing
                            android.view.ViewParent parent = view.getParent();
                            while (parent != null) {
                                if (parent instanceof androidx.swiperefreshlayout.widget.SwipeRefreshLayout) {
                                    final androidx.swiperefreshlayout.widget.SwipeRefreshLayout swipe = (androidx.swiperefreshlayout.widget.SwipeRefreshLayout) parent;
                                    swipe.post(new Runnable() {
                                        public void run() { swipe.setRefreshing(false); }
                                    });
                                    break;
                                }
                                parent = parent.getParent();
                            }
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
                                
                                androidx.swiperefreshlayout.widget.SwipeRefreshLayout swipeRefreshLayout = new androidx.swiperefreshlayout.widget.SwipeRefreshLayout(MainActivity.this);
                                swipeRefreshLayout.setLayoutParams(frameParams);
                                swipeRefreshLayout.setColorSchemeColors(android.graphics.Color.parseColor("${primaryColor}"));
                                
                                swipeRefreshLayout.setOnRefreshListener(new androidx.swiperefreshlayout.widget.SwipeRefreshLayout.OnRefreshListener() {
                                    @Override
                                    public void onRefresh() {
                                        currentBridge.getWebView().post(new Runnable() {
                                            @Override
                                            public void run() {
                                                currentBridge.getWebView().reload();
                                            }
                                        });
                                    }
                                });
                                
                                frame.setLayoutParams(new android.widget.FrameLayout.LayoutParams(
                                    android.widget.FrameLayout.LayoutParams.MATCH_PARENT, android.widget.FrameLayout.LayoutParams.MATCH_PARENT));
                                swipeRefreshLayout.addView(frame);
                                linearLayout.addView(swipeRefreshLayout);
                                
                                com.google.android.material.bottomnavigation.BottomNavigationView bottomNav = new com.google.android.material.bottomnavigation.BottomNavigationView(MainActivity.this);
                                android.widget.LinearLayout.LayoutParams navParams = new android.widget.LinearLayout.LayoutParams(
                                    android.widget.LinearLayout.LayoutParams.MATCH_PARENT, android.widget.LinearLayout.LayoutParams.WRAP_CONTENT);
                                bottomNav.setLayoutParams(navParams);
                                
                                android.content.res.ColorStateList csl = android.content.res.ColorStateList.valueOf(android.graphics.Color.parseColor("${primaryColor}"));
                                bottomNav.setItemIconTintList(csl);
                                bottomNav.setItemTextColor(csl);
                                
                                android.view.Menu menu = bottomNav.getMenu();
${menuJava}
                                
                                bottomNav.setOnItemSelectedListener(new com.google.android.material.navigation.NavigationBarView.OnItemSelectedListener() {
                                    @Override
                                    public boolean onNavigationItemSelected(android.view.MenuItem item) {
                                        WebView webView = currentBridge.getWebView();
                                        int id = item.getItemId();
${listenerJava}
                                        }
                                        return false;
                                    }
                                });
                                
                                currentBridge.getWebView().addJavascriptInterface(new AppnexusJSInterface(bottomNav), "AppnexusBridge");
                                
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
