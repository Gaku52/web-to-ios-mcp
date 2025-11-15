# Web to iOS MCP

MCP server for converting web applications (Vite/Next.js/React) to iOS apps using Capacitor.

## 概要

**Web to iOS MCP** は、既存のWebアプリケーションをiOSアプリに変換するためのMCPサーバーです。Vite、Next.js、Create React App等のフレームワークを自動検出し、Capacitorを使用したiOS化の詳細な仕様書と設定ファイルを自動生成します。

## 主な機能

### 🔍 1. フレームワーク自動検出
- **Vite + React/Vue**: package.jsonとvite.config.tsを解析
- **Next.js**: App Router / Pages Routerの検出
- **Create React App**: react-scriptsの検出
- **その他**: Parcel, Webpack等

検出内容：
- フレームワーク名とバージョン
- ビルド出力ディレクトリ
- ルーティング方式
- 使用している主要ライブラリ（React Router、Supabase等）

### 📝 2. iOS変換仕様書の自動生成
プロジェクトの構成に基づいて、以下を含む詳細な仕様書を生成：

- 現在の技術スタック分析
- Capacitorのインストール手順
- フレームワーク固有の設定変更（Vite/Next.js別）
- `capacitor.config.ts` の推奨設定
- `package.json` への追加スクリプト
- iOS固有の最適化（Safe Area、Status Bar等）
- トラブルシューティングガイド

### ⚙️ 3. 設定ファイルの自動生成
- `capacitor.config.ts`: プロジェクトに最適化された設定
- ビルド設定の変更提案
- `.gitignore` の追加項目

### ✅ 4. 移行準備チェックリスト
- Xcode環境の確認
- CocoaPodsのインストール状況
- 必要な依存関係の確認
- ビルド成功の確認

## 使い方

### MCPリソース

このMCPサーバーは、以下のドキュメントをMCPリソースとして提供します。Claude Codeから直接アクセス可能です。

#### `web-to-ios://guides/implementation`
**Implementation Guide** - iOS移行の実装ガイド

完全な実装ガイドを提供：
- 実装前の問題整理とリスク管理
- 設計原則（KISS、YAGNI、Fail Fast等）
- パフォーマンス最適化のベストプラクティス
- 品質チェックリスト
- MVP（Minimum Viable Product）の定義

#### `web-to-ios://guides/troubleshooting`
**Common Issues & Solutions** - トラブルシューティングガイド

よくある問題と解決策を網羅：
- ビルドエラー（CocoaPods、Xcode署名等）
- 実行時エラー（白い画面、ルーティング、環境変数）
- Vite特有の問題（base設定、HMR等）
- Next.js特有の問題（Static Export、画像最適化等）
- Supabase連携の問題
- UI/UX問題（Safe Area、ステータスバー、キーボード）
- パフォーマンス問題

### MCPツール

#### `detect_web_framework`
Webプロジェクトのフレームワークと構成を検出します。

**入力:**
- `projectPath`: プロジェクトディレクトリのパス

**出力:**
```json
{
  "framework": "vite",
  "version": "5.0.0",
  "uiLibrary": "react",
  "buildOutputDir": "dist",
  "routing": "react-router",
  "dependencies": {
    "supabase": "^2.78.0",
    "tailwindcss": "^3.4.0"
  }
}
```

#### `generate_ios_migration_spec`
iOS変換のための詳細な仕様書を生成します。

**入力:**
- `projectPath`: プロジェクトディレクトリのパス
- `appName`: アプリ名（例: "Spark Vault"）
- `bundleId`: Bundle ID（例: "com.ogadix.sparkvault"）

**出力:**
- Markdown形式の詳細な仕様書

#### `generate_capacitor_config`
Capacitor設定ファイルを生成します。

**入力:**
- `appName`: アプリ名
- `appId`: Bundle ID
- `webDir`: ビルド出力ディレクトリ（例: "dist"）
- `framework`: フレームワーク名（例: "vite"）

**出力:**
- `capacitor.config.ts` ファイルの内容

#### `analyze_migration_readiness`
iOS移行の準備状況をチェックします。

**入力:**
- `projectPath`: プロジェクトディレクトリのパス

**出力:**
```json
{
  "ready": false,
  "checks": [
    { "name": "Xcode installed", "status": "pass" },
    { "name": "CocoaPods installed", "status": "pass" },
    { "name": "Build successful", "status": "fail", "message": "npm run build failed" }
  ]
}
```

## 対応フレームワーク

### ✅ 対応済み（v1.0）
- **Vite + React**
- **Vite + Vue**
- **Next.js** (App Router / Pages Router)
- **Create React App**

### 🔜 今後対応予定
- Astro
- SvelteKit
- Remix
- Nuxt.js

## 技術スタック

- **TypeScript**: 型安全性
- **Node.js**: 実行環境
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **依存ライブラリ**:
  - `fs-extra`: ファイル操作
  - `glob`: ファイル検索
  - JSON/YAML パーサー

## インストール

```bash
# NPMで公開後
npm install -g web-to-ios-mcp

# または、ローカル開発
git clone https://github.com/Gaku52/web-to-ios-mcp.git
cd web-to-ios-mcp
npm install
npm run build
```

## 開発ロードマップ

### Phase 1: 基本機能（v1.0）
- [x] プロジェクト構想・仕様策定
- [ ] フレームワーク検出機能
  - [ ] Vite検出
  - [ ] Next.js検出
  - [ ] CRA検出
- [ ] iOS仕様書生成
  - [ ] Vite用テンプレート
  - [ ] Next.js用テンプレート
- [ ] Capacitor設定生成
- [ ] 移行準備チェック
- [ ] テストケース作成
- [ ] ドキュメント整備

### Phase 2: 拡張機能（v1.1+）
- [ ] より詳細な依存関係分析
- [ ] カスタムプラグイン推奨機能
- [ ] トラブルシューティング自動診断
- [ ] 既存iOSプロジェクトの検出・更新

### Phase 3: Android対応（v2.0）
- [ ] リポジトリ名を `web-to-mobile-mcp` に変更検討
- [ ] Android変換機能追加
- [ ] iOS/Android共通設定の最適化

## コントリビューション

コントリビューションを歓迎します！

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照

## 作者

Gaku52

## 関連プロジェクト

- [Spark Vault](https://github.com/Gaku52/spark-vault) - このMCPを使用してiOS化予定のアイデア管理アプリ
- [Capacitor](https://capacitorjs.com/) - Web to Nativeコンバーター

---

**Web to iOS MCP で、あなたのWebアプリを簡単にiOSアプリへ。**
