# Web to iOS 変換時のよくある問題と解決策

**最終更新**: 2025-11-15

このドキュメントでは、WebアプリケーションをiOSアプリに変換する際に発生しがちな問題と、その解決策を体系的にまとめています。各問題について、MCP自動化の可否も記載しています。

---

## 📑 目次

1. [ビルドエラー](#1-ビルドエラー)
2. [実行時エラー](#2-実行時エラー)
3. [Vite特有の問題](#3-vite特有の問題)
4. [Next.js特有の問題](#4-nextjs特有の問題)
5. [Supabase連携の問題](#5-supabase連携の問題)
6. [UI/UX問題](#6-uiux問題)
7. [パフォーマンス問題](#7-パフォーマンス問題)

---

## 1. ビルドエラー

### 1.1 CocoaPods依存関係エラー

#### ❌ 問題
```
[!] CocoaPods could not find compatible versions for pod "CapacitorCordova"
```

#### 🔍 原因
- CocoaPodsのバージョンが古い
- `Podfile.lock`が最新でない
- 依存関係の競合

#### ✅ 解決策
```bash
cd ios/App
pod deintegrate
pod install --repo-update
```

#### 🤖 MCP自動化
- ✅ **可能**: 事前にCocoaPodsバージョンをチェック
- ✅ **可能**: `pod install`失敗時に自動修復コマンド提案
- ❌ **不可**: 実行は手動（sudo権限が必要な場合あり）

---

### 1.2 Xcode署名エラー

#### ❌ 問題
```
Signing for "App" requires a development team
Code signing error: No profile for team 'XXX' matching 'iOS Team Provisioning Profile'
```

#### 🔍 原因
- 開発チーム（Apple Developer Account）が設定されていない
- プロビジョニングプロファイルの問題

#### ✅ 解決策
1. Xcodeで `Signing & Capabilities` タブを開く
2. Teamを選択（個人のApple IDまたはチーム）
3. "Automatically manage signing"をチェック

#### 🤖 MCP自動化
- ⚠️ **部分的**: 署名設定が必要であることを事前警告
- ❌ **不可**: 実際の設定は手動（GUIでの操作が必要）

---

### 1.3 ビルド入力ファイルエラー

#### ❌ 問題
```
error: Build input file cannot be found: '.../ios/App/public/index.html'
```

#### 🔍 原因
- Webアプリのビルドが実行されていない
- `webDir`の設定が間違っている
- `npx cap sync`が実行されていない

#### ✅ 解決策
```bash
# Webアプリをビルド
npm run build

# Capacitorに同期
npx cap sync ios
```

#### 🤖 MCP自動化
- ✅ **可能**: ビルドディレクトリの存在をチェック
- ✅ **可能**: 自動的に`npm run build && npx cap sync`を提案

---

### 1.4 Swift コンパイルエラー

#### ❌ 問題
```
error: No such module 'Capacitor'
error: Cannot find 'CAPBridge' in scope
```

#### 🔍 原因
- CocoaPodsのインストールが不完全
- Xcodeのキャッシュ問題

#### ✅ 解決策
```bash
# Xcodeを閉じる
# CocoaPodsを再インストール
cd ios/App
rm -rf Pods Podfile.lock
pod install

# Xcode再起動
# Product → Clean Build Folder (⇧⌘K)
```

#### 🤖 MCP自動化
- ✅ **可能**: ビルド前にPodsディレクトリの存在をチェック
- ✅ **可能**: クリーンビルドの手順を提案

---

## 2. 実行時エラー

### 2.1 白い画面（Blank Screen）

#### ❌ 問題
アプリは起動するが、白い画面のまま何も表示されない

#### 🔍 原因
- **Vite**: `base`設定が正しくない
- **React Router**: パス解決の問題
- JavaScriptエラーが発生している

#### ✅ 解決策

**Vite設定を確認:**
```typescript
// vite.config.ts
export default defineConfig({
  base: './', // 相対パスに設定
  // または
  base: '', // 空文字列
})
```

**Safari/Xcodeのコンソールを確認:**
- Xcode → Debug → Open System Log...
- エラーメッセージを確認

#### 🤖 MCP自動化
- ✅ **可能**: `vite.config.ts`の`base`設定を自動修正提案
- ✅ **可能**: よくあるエラーパターンを事前警告

---

### 2.2 ルーティングエラー

#### ❌ 問題
```
Cannot GET /ideas
404 Not Found
```

ページ遷移時にエラーが発生、またはリロードで404

#### 🔍 原因
- **React Router**: `BrowserRouter`がiOSで正しく動作しない場合がある
- サーバーサイドルーティングの設定不足

#### ✅ 解決策

**オプション1: HashRouterに変更（推奨）**
```tsx
// Before
import { BrowserRouter } from 'react-router-dom';

// After
import { HashRouter } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      {/* ... */}
    </HashRouter>
  );
}
```

**オプション2: Capacitor設定で対応**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  server: {
    cleartext: true, // 開発時のみ
  },
  ios: {
    path: 'ios/App', // 追加
  },
};
```

#### 🤖 MCP自動化
- ✅ **可能**: `BrowserRouter`の使用を検出
- ✅ **可能**: `HashRouter`への変更を提案
- ⚠️ **部分的**: コード自動変換（AST解析が必要）

---

### 2.3 環境変数が読めない

#### ❌ 問題
```
Uncaught ReferenceError: process is not defined
undefined: import.meta.env.VITE_SUPABASE_URL
```

#### 🔍 原因
- **Vite**: `import.meta.env`がiOSで正しく処理されない
- 環境変数がビルド時に埋め込まれていない
- `.env`ファイルが読み込まれていない

#### ✅ 解決策

**1. 環境変数の確認:**
```bash
# .env.production を作成
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_key
```

**2. ビルド時に環境変数を埋め込む:**
```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
  };
});
```

**3. Capacitor環境変数プラグイン（推奨）:**
```bash
npm install @capacitor/preferences
```

```typescript
import { Preferences } from '@capacitor/preferences';

// 設定
await Preferences.set({ key: 'supabase_url', value: 'xxx' });

// 取得
const { value } = await Preferences.get({ key: 'supabase_url' });
```

#### 🤖 MCP自動化
- ✅ **可能**: `.env`ファイルの存在をチェック
- ✅ **可能**: Vite設定に環境変数埋め込みコードを追加提案
- ⚠️ **部分的**: セキュリティ警告（APIキーの扱い）

---

## 3. Vite特有の問題

### 3.1 ビルド出力ディレクトリ

#### ❌ 問題
Capacitorが正しいディレクトリを参照できない

#### 🔍 原因
- Viteのデフォルト出力は`dist/`
- `capacitor.config.ts`の`webDir`設定ミス

#### ✅ 解決策
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  webDir: 'dist', // Viteのビルド出力に合わせる
};
```

```typescript
// vite.config.ts で出力ディレクトリを変更している場合
export default defineConfig({
  build: {
    outDir: 'build', // カスタムディレクトリ
  },
});

// → capacitor.config.ts も同期
webDir: 'build',
```

#### 🤖 MCP自動化
- ✅ **可能**: `vite.config.ts`の`outDir`を自動検出
- ✅ **可能**: `capacitor.config.ts`に正しい`webDir`を自動設定

---

### 3.2 公開パス（publicPath/base）

#### ❌ 問題
CSS/JS/画像が読み込まれない（404エラー）

#### 🔍 原因
- `base`が絶対パス（`/`）になっている
- iOSでは相対パスが必要

#### ✅ 解決策
```typescript
// vite.config.ts
export default defineConfig({
  base: './', // 相対パスに変更（重要！）
});
```

#### 🤖 MCP自動化
- ✅ **可能**: `base`設定を自動的に`./`に変更提案
- ✅ **可能**: iOS化時の必須設定としてチェックリストに追加

---

### 3.3 HMR（Hot Module Replacement）

#### ❌ 問題
開発モード（`npm run dev`）をCapacitorで使おうとしてエラー

#### 🔍 原因
- Capacitorは静的ファイルを期待
- HMRはWebSocketを使用（iOSで動作困難）

#### ✅ 解決策
**開発時:**
- ブラウザで開発（`npm run dev`）
- iOSシミュレータは確認用のみ

**iOS確認時:**
```bash
npm run build
npx cap sync ios
npx cap open ios
```

**または、開発サーバーを使う設定（高度）:**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  server: {
    url: 'http://localhost:5173', // Vite dev server
    cleartext: true,
  },
};
```

⚠️ **注意**: この設定は開発時のみ。本番ビルドでは削除すること

#### 🤖 MCP自動化
- ✅ **可能**: 開発用設定と本番用設定の切り替えガイド提供
- ⚠️ **警告**: 開発サーバーURL設定のリスク説明

---

## 4. Next.js特有の問題

### 4.1 Static Export設定

#### ❌ 問題
Next.jsのデフォルトビルドではiOS化できない

#### 🔍 原因
- Next.jsはデフォルトでSSR/ISRを前提
- Capacitorは静的HTMLが必要

#### ✅ 解決策
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静的エクスポート（必須！）
  images: {
    unoptimized: true, // 画像最適化を無効化
  },
  trailingSlash: true, // URLの末尾スラッシュ
};

module.exports = nextConfig;
```

#### 🤖 MCP自動化
- ✅ **可能**: `next.config.js`の存在を検出
- ✅ **可能**: 必要な設定を自動追加提案

---

### 4.2 画像最適化

#### ❌ 問題
```
Error: Image Optimization using Next.js' default loader is not compatible with `output: 'export'`
```

#### 🔍 原因
- Next.jsの`<Image>`コンポーネントがサーバー側最適化を期待

#### ✅ 解決策

**オプション1: 画像最適化を無効化**
```javascript
// next.config.js
images: {
  unoptimized: true,
}
```

**オプション2: 通常の`<img>`タグを使用**
```tsx
// Before
import Image from 'next/image';
<Image src="/logo.png" width={100} height={100} />

// After
<img src="/logo.png" width={100} height={100} />
```

#### 🤖 MCP自動化
- ✅ **可能**: `unoptimized: true`を自動設定
- ⚠️ **警告**: パフォーマンスへの影響を説明

---

### 4.3 API Routes

#### ❌ 問題
```
API Routes are not supported when output: 'export'
```

#### 🔍 原因
- `pages/api/`は静的エクスポートで使用不可
- サーバーサイド機能が必要

#### ✅ 解決策

**オプション1: 外部APIに移行**
- Supabase
- Firebase
- Vercel Serverless Functions（別デプロイ）

**オプション2: App RouterのServer Actions（不可）**
- これも静的エクスポートでは使用不可

**結論: API Routesを使用している場合、iOS化は不可能**
→ バックエンドを分離する必要あり

#### 🤖 MCP自動化
- ✅ **可能**: `pages/api/`の存在をチェック
- ✅ **可能**: API Routes使用時にエラー・代替案を提示

---

## 5. Supabase連携の問題

### 5.1 ネットワークリクエストエラー

#### ❌ 問題
```
TypeError: Network request failed
Failed to fetch
```

#### 🔍 原因
- iOS App Transport Security（ATS）の制限
- HTTPSでない通信がブロックされている
- CORSの問題（開発時）

#### ✅ 解決策

**1. Capacitor設定でHTTPSスキームを使用:**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  server: {
    iosScheme: 'https', // 重要！
  },
};
```

**2. Info.plistでネットワーク許可（本番では非推奨）:**
```xml
<!-- ios/App/App/Info.plist -->
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

⚠️ **警告**: App Storeでは基本的にHTTPSのみ許可

#### 🤖 MCP自動化
- ✅ **可能**: `iosScheme: 'https'`を自動設定
- ⚠️ **警告**: HTTP通信のセキュリティリスクを説明

---

### 5.2 Supabase認証リダイレクト

#### ❌ 問題
認証後のリダイレクトが動作しない

#### 🔍 原因
- Capacitorアプリ内ではカスタムURLスキームが必要
- `window.location`が期待通りに動かない

#### ✅ 解決策

**1. Deep Linkの設定:**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.ogadix.sparkvault',
  // ...
  plugins: {
    // Deep Link設定
  },
};
```

**2. Supabase認証設定:**
```typescript
import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      redirectTo: Capacitor.isNativePlatform()
        ? 'com.ogadix.sparkvault://login-callback' // カスタムスキーム
        : window.location.origin, // Web
    },
  }
);
```

**3. Info.plistにURLスキーム追加:**
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.ogadix.sparkvault</string>
        </array>
    </dict>
</array>
```

#### 🤖 MCP自動化
- ⚠️ **部分的**: URLスキーム設定の必要性を警告
- ❌ **困難**: Info.plist自動編集（XML解析が必要）

---

### 5.3 リアルタイム機能

#### ❌ 問題
Supabase Realtimeが動作しない、または不安定

#### 🔍 原因
- WebSocketの接続問題
- バックグラウンド時の接続切断

#### ✅ 解決策

**1. WebSocket接続の確認:**
```typescript
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10, // 接続頻度を調整
    },
  },
});
```

**2. バックグラウンド対応:**
```typescript
import { App } from '@capacitor/app';

App.addListener('appStateChange', ({ isActive }) => {
  if (!isActive) {
    // バックグラウンド時の処理
    supabase.removeAllChannels();
  } else {
    // フォアグラウンド時の再接続
    subscribeToRealtime();
  }
});
```

#### 🤖 MCP自動化
- ⚠️ **部分的**: Realtime使用時の注意事項を説明
- ❌ **困難**: バックグラウンド処理の実装（コード生成が複雑）

---

## 6. UI/UX問題

### 6.1 Safe Area（セーフエリア）

#### ❌ 問題
- ノッチにコンテンツが隠れる
- ステータスバーにUIが重なる
- 画面下部のインジケーターにボタンが隠れる

#### 🔍 原因
- iOSのSafe Areaに対応していない
- `viewport-fit=cover`の設定不足

#### ✅ 解決策

**1. HTMLメタタグに追加:**
```html
<!-- index.html -->
<meta name="viewport" content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

**2. CSSでSafe Area対応:**
```css
/* globals.css */
body {
  /* iOS Safe Area対応 */
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}

/* または、特定の要素のみ */
.header {
  padding-top: max(20px, env(safe-area-inset-top));
}

.footer {
  padding-bottom: max(20px, env(safe-area-inset-bottom));
}
```

**3. TailwindCSSでの対応:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
};
```

```tsx
// 使用例
<div className="pt-safe-top pb-safe-bottom">
  {/* コンテンツ */}
</div>
```

#### 🤖 MCP自動化
- ✅ **可能**: `viewport-fit=cover`を`index.html`に自動追加
- ✅ **可能**: Safe Area対応CSSコードの提案
- ⚠️ **部分的**: 既存CSSへの自動適用（影響範囲が大きい）

---

### 6.2 ステータスバー

#### ❌ 問題
- ステータスバーが白/黒で見にくい
- ステータスバーとアプリの境界が不明確

#### 🔍 原因
- Capacitor Status Barプラグインの未設定

#### ✅ 解決策

**1. プラグインインストール:**
```bash
npm install @capacitor/status-bar
```

**2. 設定:**
```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  plugins: {
    StatusBar: {
      style: 'dark', // 'light' or 'dark'
      backgroundColor: '#ffffff',
    },
  },
};
```

**3. 動的変更:**
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// ダークモード時
await StatusBar.setStyle({ style: Style.Dark });

// ライトモード時
await StatusBar.setStyle({ style: Style.Light });

// 背景色
await StatusBar.setBackgroundColor({ color: '#8b5cf6' });
```

#### 🤖 MCP自動化
- ✅ **可能**: StatusBarプラグインを依存関係に自動追加
- ✅ **可能**: 基本設定を`capacitor.config.ts`に自動追加

---

### 6.3 キーボード挙動

#### ❌ 問題
- キーボード表示時にUIが隠れる
- キーボードを閉じるボタンがない
- スクロールが正しく動作しない

#### 🔍 原因
- iOS特有のキーボード挙動
- Webとネイティブの違い

#### ✅ 解決策

**1. Keyboardプラグイン:**
```bash
npm install @capacitor/keyboard
```

**2. 設定:**
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  plugins: {
    Keyboard: {
      resize: 'body', // キーボード表示時にbodyをリサイズ
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};
```

**3. キーボードイベント:**
```typescript
import { Keyboard } from '@capacitor/keyboard';

// キーボード表示時
Keyboard.addListener('keyboardWillShow', (info) => {
  document.body.style.paddingBottom = `${info.keyboardHeight}px`;
});

// キーボード非表示時
Keyboard.addListener('keyboardWillHide', () => {
  document.body.style.paddingBottom = '0px';
});
```

#### 🤖 MCP自動化
- ✅ **可能**: Keyboardプラグインの追加提案
- ✅ **可能**: 基本設定の自動追加
- ⚠️ **部分的**: イベントハンドラの実装（コード生成が必要）

---

## 7. パフォーマンス問題

### 7.1 初回起動が遅い

#### ❌ 問題
アプリ起動に5秒以上かかる

#### 🔍 原因
- JavaScriptバンドルサイズが大きい
- 画像・アセットの最適化不足
- スプラッシュスクリーンの設定不足

#### ✅ 解決策

**1. ビルド最適化:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.log削除
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
        },
      },
    },
  },
});
```

**2. スプラッシュスクリーン:**
```bash
npm install @capacitor/splash-screen
```

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#8b5cf6',
      showSpinner: false,
    },
  },
};
```

**3. Code Splitting:**
```tsx
// React.lazy()で遅延読み込み
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Ideas = React.lazy(() => import('./pages/Ideas'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/ideas" element={<Ideas />} />
  </Routes>
</Suspense>
```

#### 🤖 MCP自動化
- ✅ **可能**: ビルド最適化設定の提案
- ✅ **可能**: SplashScreenプラグインの追加
- ⚠️ **部分的**: Code Splitting実装（既存コード解析が必要）

---

### 7.2 スクロールパフォーマンス

#### ❌ 問題
スクロールがカクつく、反応が遅い

#### 🔍 原因
- `-webkit-overflow-scrolling: touch`の不足
- 重いレンダリング処理

#### ✅ 解決策

**1. CSSで最適化:**
```css
/* iOS スクロール最適化 */
.scrollable {
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
}

/* GPU加速 */
.animated-element {
  transform: translateZ(0);
  will-change: transform;
}
```

**2. 仮想化（長いリスト）:**
```bash
npm install react-window
```

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={ideas.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <IdeaCard idea={ideas[index]} />
    </div>
  )}
</FixedSizeList>
```

#### 🤖 MCP自動化
- ✅ **可能**: スクロール最適化CSSの提案
- ⚠️ **部分的**: 仮想化の提案（実装は手動）

---

## 8. まとめ：MCP自動化の優先度

### 🟢 高優先度（必ず自動化すべき）

1. ✅ Vite `base`設定の自動修正
2. ✅ `capacitor.config.ts`の生成（webDir、iosScheme等）
3. ✅ CocoaPodsバージョンチェック
4. ✅ ビルド出力ディレクトリの検証
5. ✅ 環境変数の埋め込み確認
6. ✅ Safe Area対応の追加（viewport-fit）
7. ✅ Next.js static export設定の追加

### 🟡 中優先度（できれば自動化）

1. ⚠️ StatusBar/SplashScreenプラグインの追加
2. ⚠️ `BrowserRouter` → `HashRouter`変更の提案
3. ⚠️ ビルド最適化設定の提案
4. ⚠️ API Routes使用の検出・警告

### 🔴 低優先度（手動対応推奨）

1. ❌ Xcode署名設定（GUIでの操作が必要）
2. ❌ Supabase認証リダイレクト（プロジェクト固有）
3. ❌ Code Splitting実装（既存コード改修が必要）
4. ❌ Info.plist編集（XMLパーサーが必要、リスク高）

---

**このドキュメントは実際のiOS化を通じて随時更新されます。**

最終更新: 2025-11-15
