import fs from 'fs';
import path from 'path';

console.log('--- Customizing iOS Native App wrapper ---');

let config = {};
try {
  const configRaw = fs.readFileSync('appnexus.config.json', 'utf8');
  config = JSON.parse(configRaw);
} catch (e) {
  console.log('No appnexus.config.json found, using defaults.');
}

const primaryColorHex = config.primaryColor || '#22d3ee';
const navigationStyle = config.navigationStyle || 'bottom-nav';

const navigationItems = config.navigationItems || [
  { label: 'Home', action: 'home' },
  { label: 'Back', action: 'back' },
  { label: 'Forward', action: 'forward' },
  { label: 'Reload', action: 'reload' }
];

function hexToSwiftUIColor(hex) {
    hex = hex.replace('#', '');
    if(hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    const r = parseInt(hex.substring(0,2), 16) / 255.0;
    const g = parseInt(hex.substring(2,4), 16) / 255.0;
    const b = parseInt(hex.substring(4,6), 16) / 255.0;
    return `UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: 1.0)`;
}

// 1. Find AppDelegate.swift
function findAppDelegate(dir) {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            const found = findAppDelegate(fullPath);
            if (found) return found;
        } else if (file === 'AppDelegate.swift') {
            return fullPath;
        }
    }
    return null;
}

const appDelegatePath = findAppDelegate('ios/App/App');
if (appDelegatePath && navigationStyle === 'bottom-nav') {
    console.log('Found AppDelegate.swift at:', appDelegatePath);
    let content = fs.readFileSync(appDelegatePath, 'utf8');

    // We inject UITabBarController wrapping the Capacitor ViewController
    
    let tabItemsSwift = '';
    navigationItems.forEach((item, index) => {
        // Fallback standard symbols since iOS SF Symbols differ from Android drawables
        let systemImage = 'circle';
        if (item.action === 'home') systemImage = 'house';
        if (item.action === 'back') systemImage = 'chevron.backward';
        if (item.action === 'forward') systemImage = 'chevron.forward';
        if (item.action === 'reload') systemImage = 'arrow.clockwise';
        
        tabItemsSwift += `
        let item${index} = UIViewController()
        item${index}.tabBarItem = UITabBarItem(title: "${item.label}", image: UIImage(systemName: "${systemImage}"), tag: ${index})
        controllers.append(item${index})
        `;
    });

    const cssPayload = `
      ${config.hideSelectors || 'header, footer, nav, [role="navigation"]'} { display: none !important; }
      :root {
        --primary-color: ${primaryColorHex} !important;
        --primary: ${primaryColorHex} !important;
      }
      body {
        padding-bottom: ${navigationStyle === 'bottom-nav' ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : '0px'} !important;
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
      ${config.customCSS || ''}
    `;

    const jsPayload = `
      document.addEventListener('click', (e) => {
        if (e.target.closest('button, a, [role="button"]')) {
          if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
            window.Capacitor.Plugins.Haptics.impact({ style: 'Light' });
          }
        }
      });
      ${config.customJS || ''}
    `;
    
    const cssBase64 = Buffer.from(cssPayload).toString('base64');
    const jsBase64 = Buffer.from(jsPayload).toString('base64');

    const swiftInjection = `
    // Appnexus Custom Tab Bar Injection
    let window = UIWindow(frame: UIScreen.main.bounds)
    let bridgeVC = CAPBridgeViewController()
    
    // Inject Native UX Physics & Haptics via WKUserScript
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        if let webView = bridgeVC.bridge?.webView as? WKWebView {
            let injectCssJs = """
            var style = document.createElement('style');
            style.id = 'appnexus-style';
            style.innerHTML = atob('${cssBase64}');
            document.head.appendChild(style);
            
            try { eval(decodeURIComponent(escape(atob('${jsBase64}')))); } catch(e) { console.error('AI Injection Error:', e); }
            """
            let script = WKUserScript(source: injectCssJs, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
            webView.configuration.userContentController.addUserScript(script)
            // also execute immediately in case it's already loaded
            webView.evaluateJavaScript(injectCssJs, completionHandler: nil)
        }
    }
    
    let tabBarController = UITabBarController()
    tabBarController.tabBar.tintColor = ${hexToSwiftUIColor(primaryColorHex)}
    
    var controllers: [UIViewController] = [bridgeVC]
    ${tabItemsSwift}
    
    tabBarController.viewControllers = controllers
    
    window.rootViewController = tabBarController
    window.makeKeyAndVisible()
    self.window = window
    // End Appnexus Injection
    `;

    // Try to replace the standard "return true" in didFinishLaunchingWithOptions
    if (content.includes('return true') && !content.includes('Appnexus Custom Tab Bar')) {
        content = content.replace('return true', `${swiftInjection}\n        return true`);
        fs.writeFileSync(appDelegatePath, content, 'utf8');
        console.log('AppDelegate.swift successfully configured with iOS Native Tab Bar!');
    } else {
        console.log('AppDelegate.swift already configured or missing expected return statement.');
    }
} else {
    console.log('AppDelegate.swift not found or navigationStyle is not bottom-nav.');
}

console.log('--- iOS Customization complete ---');
process.exit(0);
