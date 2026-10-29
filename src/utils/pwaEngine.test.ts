import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('PWA Manifest & Configuration Verification', () => {
  const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');

  test('manifest.json exists and is valid JSON', () => {
    assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist in public folder');
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);
    assert.strictEqual(typeof manifest, 'object');
  });

  test('manifest.json specifies required BlockFlow PWA fields', () => {
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    assert.strictEqual(manifest.name, 'BlockFlow');
    assert.strictEqual(manifest.short_name, 'BlockFlow');
    assert.strictEqual(manifest.start_url, '/quick-add');
    assert.strictEqual(manifest.display, 'standalone');
    assert.strictEqual(manifest.background_color, '#090D16');
    assert.strictEqual(manifest.theme_color, '#090D16');
    assert.strictEqual(manifest.scope, '/');
  });

  test('manifest.json includes standard and maskable icons in required resolutions', () => {
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    assert.ok(Array.isArray(manifest.icons), 'icons must be an array');

    const icon192 = manifest.icons.find((i: any) => i.sizes === '192x192' && i.purpose === 'any');
    const icon512 = manifest.icons.find((i: any) => i.sizes === '512x512' && i.purpose === 'any');
    const maskable192 = manifest.icons.find((i: any) => i.sizes === '192x192' && i.purpose === 'maskable');
    const maskable512 = manifest.icons.find((i: any) => i.sizes === '512x512' && i.purpose === 'maskable');

    assert.ok(icon192, 'Must have 192x192 standard icon');
    assert.ok(icon512, 'Must have 512x512 standard icon');
    assert.ok(maskable192, 'Must have 192x192 maskable icon');
    assert.ok(maskable512, 'Must have 512x512 maskable icon');

    // Verify physical icon files exist in public/
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'public' + icon192.src)));
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'public' + icon512.src)));
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'public' + maskable192.src)));
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'public' + maskable512.src)));
  });

  test('manifest.json specifies shortcuts for Quick Capture and Dashboard', () => {
    const content = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(content);

    assert.ok(Array.isArray(manifest.shortcuts));
    const captureShortcut = manifest.shortcuts.find((s: any) => s.url === '/quick-add');
    const dashboardShortcut = manifest.shortcuts.find((s: any) => s.url === '/dashboard');

    assert.ok(captureShortcut, 'Quick capture shortcut must be present');
    assert.ok(dashboardShortcut, 'Dashboard shortcut must be present');
  });
});

describe('Service Worker File & Assets', () => {
  const swPath = path.resolve(process.cwd(), 'public/sw.js');

  test('sw.js exists and contains core cache and fetch handling', () => {
    assert.ok(fs.existsSync(swPath), 'sw.js must exist in public folder');
    const swContent = fs.readFileSync(swPath, 'utf8');

    assert.ok(swContent.includes('blockflow-pwa-v1'));
    assert.ok(swContent.includes('/quick-add'));
    assert.ok(swContent.includes('/manifest.json'));
    assert.ok(swContent.includes('install'));
    assert.ok(swContent.includes('activate'));
    assert.ok(swContent.includes('fetch'));
  });
});

describe('iOS and Platform Detection Logic', () => {
  const isAppleMobileDevice = (ua: string, platform: string = '', maxTouchPoints: number = 0): boolean => {
    return /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
  };

  test('detects iPhone and iPod correctly', () => {
    const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
    assert.strictEqual(isAppleMobileDevice(iphoneUA), true);
  });

  test('detects modern iPadOS with MacIntel platform and touch points', () => {
    const ipadDesktopUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    assert.strictEqual(isAppleMobileDevice(ipadDesktopUA, 'MacIntel', 5), true);
  });

  test('returns false for desktop Mac or Android', () => {
    const macDesktopUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    assert.strictEqual(isAppleMobileDevice(macDesktopUA, 'MacIntel', 0), false);

    const androidUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';
    assert.strictEqual(isAppleMobileDevice(androidUA, 'Linux armv8l', 5), false);
  });
});
