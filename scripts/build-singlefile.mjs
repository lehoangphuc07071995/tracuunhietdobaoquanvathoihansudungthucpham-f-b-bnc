import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const distDir = path.join(rootDir, 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const publicDir = path.join(rootDir, 'public');
const releaseDir = path.join(rootDir, 'release');

function toDataUri(filePath, mimeType) {
  const buf = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${buf.toString('base64')}`;
}

function escapeInlineScript(jsCode) {
  return jsCode.replace(/<\/script/gi, '<\\/script');
}

function escapeInlineStyle(cssCode) {
  return cssCode.replace(/<\/style/gi, '<\\/style');
}

async function buildSingleHtml() {
  const distHtmlPath = path.join(distDir, 'index.html');
  if (!fs.existsSync(distHtmlPath)) {
    throw new Error('Missing dist/index.html. Run "vite build" first.');
  }

  const assetFiles = fs.readdirSync(distAssetsDir);
  const cssFile = assetFiles.find((f) => f.endsWith('.css'));
  const jsFile = assetFiles.find((f) => f.endsWith('.js'));

  if (!cssFile || !jsFile) {
    throw new Error('Expected CSS and JS bundle files in dist/assets/.');
  }

  const cssRaw = fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf8');
  const jsRaw = fs.readFileSync(path.join(distAssetsDir, jsFile), 'utf8');

  const logoJpgUri = toDataUri(path.join(publicDir, 'bnc-logo.jpg'), 'image/jpeg');
  const appleIconUri = toDataUri(path.join(publicDir, 'apple-touch-icon.png'), 'image/png');
  const icon192Uri = toDataUri(path.join(publicDir, 'icon-192.png'), 'image/png');
  const icon512Uri = toDataUri(path.join(publicDir, 'icon-512.png'), 'image/png');
  const iconMaskableUri = toDataUri(
    path.join(publicDir, 'icon-maskable-512.png'),
    'image/png'
  );

  // Replace external /bnc-logo.jpg reference inside JS bundle with inline base64 data URI
  const jsWithEmbeddedLogo = jsRaw.split('"/bnc-logo.jpg"').join(JSON.stringify(logoJpgUri));

  // Convert ES module bundle into standalone IIFE so file:// and static GitHub Pages both work cleanly
  const iifeResult = await esbuild.build({
    stdin: {
      contents: jsWithEmbeddedLogo,
      loader: 'js',
      resolveDir: rootDir,
    },
    bundle: false,
    write: false,
    format: 'iife',
    minify: true,
    target: ['es2020'],
  });
  const iifeCode = iifeResult.outputFiles[0].text;

  // Inline Web App Manifest with embedded PNG icons for Add to Home Screen
  const manifestJson = {
    id: '/',
    name: 'Hệ Thống Tra Cứu Nhiệt Độ Bảo Quản & Thời Hạn Sử Dụng Thực Phẩm - BNC',
    short_name: 'Tra Cứu BNC',
    description:
      'Hệ thống tra cứu nhiệt độ bảo quản và thời hạn sử dụng thực phẩm - Ban Ẩm Thực Sun World Ba Na Hills.',
    start_url: './',
    scope: './',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#122A47',
    theme_color: '#122A47',
    icons: [
      { src: icon192Uri, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512Uri, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: iconMaskableUri, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  const manifestUri = `data:application/manifest+json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(manifestJson)
  )}`;

  let html = fs.readFileSync(distHtmlPath, 'utf8');

  // Remove Vite external stylesheet & module script tags
  html = html.replace(/<script[^>]+src="\/assets\/[^"]+"[^>]*><\/script>\s*/g, '');
  html = html.replace(/<link[^>]+rel="stylesheet"[^>]+href="\/assets\/[^"]+"[^>]*>\s*/g, '');

  // Inline head icon & manifest links so 1 single HTML file is 100% self-contained
  html = html
    .replace('href="/manifest.webmanifest"', `href="${manifestUri}"`)
    .replace('href="/icon-192.png"', `href="${icon192Uri}"`)
    .replace('href="/icon-512.png"', `href="${icon512Uri}"`)
    .replaceAll('href="/apple-touch-icon.png"', `href="${appleIconUri}"`);

  // Inject inline <style> in <head> and inline <script> before </body>
  // Use function replacer to avoid special '$' pattern expansion inside CSS/JS code
  const inlineStyleTag = `  <style>\n${escapeInlineStyle(cssRaw)}\n  </style>\n  </head>`;
  const inlineScriptTag = `  <script>\n${escapeInlineScript(iifeCode)}\n  </script>\n  </body>`;
  html = html.replace('</head>', () => inlineStyleTag);
  html = html.replace('</body>', () => inlineScriptTag);

  fs.mkdirSync(releaseDir, { recursive: true });
  const outPath = path.join(releaseDir, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');

  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
  console.log(`Built standalone single HTML: release/index.html (${sizeKb} KB)`);
}

buildSingleHtml().catch((err) => {
  console.error(err);
  process.exit(1);
});
