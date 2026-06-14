const fs = require('fs');
const path = require('path');

console.log('--- Customizing Android Native App wrapper ---');

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
      --primary: #22d3ee;
      --primary-hover: #0891b2;
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
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 12px;
      letter-spacing: -0.025em;
    }
    p {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.6;
      margin: 0 0 32px;
    }
    button {
      background: var(--primary);
      color: #0b0f19;
      border: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(34, 211, 238, 0.2);
    }
    button:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(34, 211, 238, 0.3);
    }
    button:active {
      transform: translateY(0);
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

fs.mkdirSync('dist', { recursive: true });
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
    
    const primaryColor = process.env.PRIMARY_COLOR || '#22d3ee';
    const accentColor = process.env.ACCENT_COLOR || '#a855f7';
    const navigationStyle = process.env.NAVIGATION_STYLE || 'bottom-nav';
    const websiteUrl = process.env.WEBSITE_URL || '';
    const rawHideSelectors = process.env.HIDE_SELECTORS || '';
    const hideSelectors = (rawHideSelectors.trim() || 'header, footer, nav, [role="navigation"], .header, .footer, .navbar, .nav-bar, .site-header, .site-footer, #header, #footer, #navbar, .menu-bar, .cookie-banner, .cookie-consent, .download-app-banner, .app-banner')
      .replace(/"/g, '\\"');
    
    const paddingBottom = navigationStyle === 'bottom-nav' ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : '0px';

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
                                         "  " + hideSelectors + " { display: none !important; } " +
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
                            
                            // Inject custom bottom navigation wrapper if layout is bottom-nav
                            if ("bottom-nav".equals("${navigationStyle}")) {
                                String navJs = "if (!document.getElementById('appnexus-bottom-nav')) {" +
                                               "  var div = document.createElement('div');" +
                                               "  div.id = 'appnexus-bottom-nav';" +
                                               "  div.innerHTML = `<div style=\"position: fixed; bottom: 0; left: 0; right: 0; height: 56px; background: #0f172a; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-around; align-items: center; z-index: 999999; box-shadow: 0 -4px 12px rgba(0,0,0,0.15); padding-bottom: env(safe-area-inset-bottom, 0px);\">" +
                                               "    <div onclick=\"window.location.href=\\'${websiteUrl}\\'\" style=\"text-align: center; color: #94a3b8; font-family: sans-serif; font-size: 10px; cursor: pointer; flex: 1;\"><svg style=\"width:20px;height:20px;fill:currentColor;margin:0 auto 2px;\" viewBox=\"0 0 24 24\"><path d=\"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z\"/></svg><span style=\"display:block;\">Home</span></div>" +
                                               "    <div onclick=\"window.history.back()\" style=\"text-align: center; color: #94a3b8; font-family: sans-serif; font-size: 10px; cursor: pointer; flex: 1;\"><svg style=\"width:20px;height:20px;fill:currentColor;margin:0 auto 2px;\" viewBox=\"0 0 24 24\"><path d=\"M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z\"/></svg><span style=\"display:block;\">Back</span></div>" +
                                               "    <div onclick=\"window.history.forward()\" style=\"text-align: center; color: #94a3b8; font-family: sans-serif; font-size: 10px; cursor: pointer; flex: 1;\"><svg style=\"width:20px;height:20px;fill:currentColor;margin:0 auto 2px;\" viewBox=\"0 0 24 24\"><path d=\"M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z\"/></svg><span style=\"display:block;\">Forward</span></div>" +
                                               "    <div onclick=\"window.location.reload()\" style=\"text-align: center; color: #94a3b8; font-family: sans-serif; font-size: 10px; cursor: pointer; flex: 1;\"><svg style=\"width:20px;height:20px;fill:currentColor;margin:0 auto 2px;\" viewBox=\"0 0 24 24\"><path d=\"M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z\"/></svg><span style=\"display:block;\">Reload</span></div>" +
                                               "  </div>`;" +
                                               "  document.body.appendChild(div);" +
                                               "}";
                                view.evaluateJavascript(navJs, null);
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
        }
    }
}
`;
    
    fs.writeFileSync(mainActivityPath, customMainActivity, 'utf8');
    console.log('MainActivity.java successfully configured!');
} else {
    console.error('MainActivity.java not found in project paths.');
}
console.log('--- Customization complete ---');
process.exit(0);
