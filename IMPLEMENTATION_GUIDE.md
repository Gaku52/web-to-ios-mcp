# Web to iOS MCP - 実装ガイド

**最終更新**: 2025-11-15

このドキュメントは、実装前に考慮すべき問題、制約、リスクを整理し、「使うに値する」MCPサーバーを作るための指針を示します。

---

## 🎯 最重要原則

### **「使うに値する」こと**

**これが最優先です。**

- ❌ 美しいが使えないコード
- ❌ 完璧だが遅いツール
- ❌ 機能は多いが複雑すぎる
- ✅ **シンプルで、速く、確実に動く**

**判断基準:**
- 「これは実際のユーザーの問題を解決するか？」
- 「手動でやった方が速くないか？」
- 「エラーメッセージは理解できるか？」

---

## 📊 実装前の問題整理

### 1. 技術的な制約

#### 1.1 MCP SDKの制約

**問題:**
- MCP SDKのドキュメントが限定的
- TypeScript型定義が不完全な可能性
- デバッグが難しい

**対策:**
- ✅ シンプルな実装から始める
- ✅ 公式サンプルを参考にする
- ✅ エラーログを詳細に出力

**リスク:**
- 🔴 高: SDK仕様の理解不足
- 🟡 中: 予期しないエラー

**軽減策:**
```typescript
// 必ず try-catch で包む
try {
  const result = await detectFramework(path);
  return result;
} catch (error) {
  console.error('Detection failed:', error);
  return { error: error.message, suggestions: [...] };
}
```

---

#### 1.2 ファイルシステム操作

**問題:**
- パスが存在しない
- 権限エラー
- シンボリックリンク
- 大規模プロジェクト（node_modules等）

**対策:**
```typescript
import fs from 'fs/promises';
import path from 'path';

async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    // 存在確認
    await fs.access(filePath);

    // サイズ確認（巨大ファイルを防ぐ）
    const stats = await fs.stat(filePath);
    if (stats.size > 10 * 1024 * 1024) { // 10MB制限
      return null;
    }

    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.warn(`Failed to read ${filePath}:`, error.message);
    return null;
  }
}
```

**リスク:**
- 🟢 低: 適切なエラーハンドリングで対処可能

---

#### 1.3 package.json解析

**問題:**
- 不正なJSON
- 巨大な依存関係
- monorepo（複数のpackage.json）

**対策:**
```typescript
async function parsePackageJson(projectPath: string): Promise<any> {
  const pkgPath = path.join(projectPath, 'package.json');
  const content = await safeReadFile(pkgPath);

  if (!content) {
    throw new Error('package.json not found');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error('Invalid package.json: ' + error.message);
  }
}
```

**リスク:**
- 🟡 中: 不正なJSONは想定内
- 🟢 低: try-catchで対処

---

### 2. 設計上の問題

#### 2.1 どこまで自動化するか

**原則:**
- ✅ 自動化すべき: 機械的な判定・設定生成
- ❌ 自動化しない: 創造的判断・セキュリティ設定

**具体例:**

| タスク | 自動化 | 理由 |
|--------|--------|------|
| フレームワーク検出 | ✅ Yes | 機械的判定 |
| `base` 設定修正提案 | ✅ Yes | 確実な対応 |
| capacitor.config.ts生成 | ✅ Yes | テンプレート化可能 |
| Bundle ID決定 | ❌ No | ビジネス判断 |
| Xcode署名設定 | ❌ No | GUIでの操作 |
| API Keys設定 | ❌ No | セキュリティ |

**判断基準:**
```
自動化OK = (確実性が高い) AND (副作用が少ない)
```

---

#### 2.2 エラーメッセージの設計

**悪い例:**
```
Error: Failed
```

**良い例:**
```
❌ Vite project detected, but vite.config.ts not found.

Possible causes:
1. Using vite.config.js instead
2. Project not fully initialized

Suggestions:
- Check if 'vite.config.js' exists
- Run 'npm install' first

Need help? See: https://github.com/Gaku52/web-to-ios-mcp/issues
```

**設計原則:**
- 何が起きたか（What）
- なぜ起きたか（Why）
- どうすれば良いか（How）
- 助けを求める方法（Help）

---

#### 2.3 テンプレートの管理

**問題:**
- テンプレートが古くなる
- フレームワークのバージョンアップ
- ハードコードの限界

**対策:**

**オプション1: 動的生成（推奨）**
```typescript
function generateViteSpec(projectInfo: ViteProjectInfo): string {
  return `
# ${projectInfo.appName} - iOS変換仕様書

## 現在の構成
- フレームワーク: Vite ${projectInfo.viteVersion}
- UIライブラリ: ${projectInfo.uiLibrary}
- ビルド出力: ${projectInfo.buildOutputDir}

## 手順
${generateSteps(projectInfo)}
  `.trim();
}
```

**オプション2: テンプレートファイル（柔軟）**
```typescript
// templates/vite-spec.md
# {{appName}} - iOS変換仕様書

## 現在の構成
- フレームワーク: Vite {{viteVersion}}
...
```

**採用: オプション1（動的生成）**
- 理由: 柔軟性が高く、メンテナンスしやすい

---

### 3. パフォーマンス問題

#### 3.1 大規模プロジェクトの検出

**問題:**
- node_modulesを含む巨大ディレクトリ
- 数千ファイルのスキャン

**対策:**
```typescript
// ❌ 遅い
async function findAllFiles(dir: string): Promise<string[]> {
  // 全ファイルを再帰的に探索（遅い！）
}

// ✅ 速い
async function detectFramework(projectPath: string): Promise<ProjectInfo> {
  // 必要最小限のファイルのみチェック
  const checks = [
    fs.access(path.join(projectPath, 'package.json')),
    fs.access(path.join(projectPath, 'vite.config.ts')),
    fs.access(path.join(projectPath, 'next.config.js')),
  ];

  // 並列実行
  const results = await Promise.allSettled(checks);

  // 最初に見つかったもので判定
}
```

**パフォーマンス目標:**
- フレームワーク検出: < 1秒
- 仕様書生成: < 3秒

---

#### 3.2 同期処理の最小化

**原則:**
```typescript
// ❌ 避ける: 同期処理
const content = fs.readFileSync(filePath, 'utf-8');

// ✅ 推奨: 非同期処理
const content = await fs.readFile(filePath, 'utf-8');
```

---

### 4. 保守性の問題

#### 4.1 コードの可読性

**原則:**
- 関数は1つのことだけする
- 関数名は動詞で始める
- 型定義を明確にする

**例:**
```typescript
// ❌ 悪い
async function d(p: string): Promise<any> {
  const pkg = JSON.parse(await fs.readFile(p + '/package.json', 'utf-8'));
  if (pkg.dependencies?.vite) return { f: 'vite', v: pkg.dependencies.vite };
  // ...
}

// ✅ 良い
async function detectViteProject(projectPath: string): Promise<ViteProjectInfo | null> {
  const packageJson = await readPackageJson(projectPath);

  if (!hasViteDependency(packageJson)) {
    return null;
  }

  const viteVersion = extractViteVersion(packageJson);
  const uiLibrary = detectUILibrary(packageJson);

  return {
    framework: 'vite',
    version: viteVersion,
    uiLibrary,
  };
}
```

---

#### 4.2 型安全性

**すべての関数に型定義:**
```typescript
// types/framework.ts
export interface ProjectInfo {
  framework: 'vite' | 'nextjs' | 'cra';
  version: string;
  buildCommand: string;
  buildOutputDir: string;
}

export interface ViteProjectInfo extends ProjectInfo {
  framework: 'vite';
  uiLibrary: 'react' | 'vue' | 'svelte';
  viteConfigPath: string;
}

// detectors/vite-detector.ts
export async function detectViteProject(
  projectPath: string
): Promise<ViteProjectInfo | null> {
  // 実装
}
```

**unknown より any を避ける:**
```typescript
// ❌ 避ける
function parse(data: any): any { ... }

// ✅ 推奨
function parse(data: unknown): ProjectInfo {
  if (!isValidProjectInfo(data)) {
    throw new Error('Invalid data');
  }
  return data;
}
```

---

#### 4.3 テストカバレッジ

**最低限のテスト:**
```typescript
// tests/detectors/vite-detector.test.ts
describe('ViteDetector', () => {
  it('should detect Vite + React project', async () => {
    const result = await detectViteProject('./fixtures/vite-react');
    expect(result).toEqual({
      framework: 'vite',
      uiLibrary: 'react',
      // ...
    });
  });

  it('should return null for non-Vite project', async () => {
    const result = await detectViteProject('./fixtures/nextjs');
    expect(result).toBeNull();
  });

  it('should handle missing package.json', async () => {
    await expect(detectViteProject('./non-existent'))
      .rejects.toThrow('package.json not found');
  });
});
```

**目標カバレッジ: 80%以上**

---

### 5. 実用性の問題

#### 5.1 ユーザー体験

**良いMCPツールの条件:**

1. **速い**: 1-3秒で結果
2. **正確**: エラーが少ない
3. **親切**: エラー時に解決策を提示
4. **安全**: 破壊的操作をしない

**ダメなMCPツールの例:**
```typescript
// ❌ 悪い
{
  name: 'auto_fix_everything',
  description: 'Automatically fix all issues',
  // → 何をするか不明、怖い
}
```

**良いMCPツールの例:**
```typescript
// ✅ 良い
{
  name: 'generate_ios_migration_spec',
  description: 'Generate iOS migration specification (read-only, safe)',
  // → 何をするか明確、安全
}
```

---

#### 5.2 ドキュメントの充実度

**必須ドキュメント:**
- ✅ README.md: クイックスタート
- ✅ SPECIFICATION.md: 技術仕様
- ✅ COMMON_ISSUES.md: トラブルシューティング
- ✅ IMPLEMENTATION_GUIDE.md: 実装ガイド（本ドキュメント）

**ツール内のヘルプ:**
```typescript
// すべてのツールに詳細な説明
{
  name: 'detect_web_framework',
  description: `
    Detects the web framework used in a project.

    Supported frameworks:
    - Vite (React, Vue, Svelte)
    - Next.js (App Router, Pages Router)
    - Create React App

    Returns null if framework is not supported.

    Example:
    {
      "framework": "vite",
      "version": "5.0.0",
      "uiLibrary": "react"
    }
  `,
}
```

---

### 6. リスク管理

#### 6.1 実装リスク

| リスク | 影響 | 確率 | 対策 |
|--------|------|------|------|
| MCP SDK仕様の理解不足 | 🔴 高 | 🟡 中 | 公式サンプル参照、シンプルな実装 |
| package.json解析エラー | 🟡 中 | 🟡 中 | try-catch、詳細なエラーログ |
| 大規模プロジェクトで遅い | 🟡 中 | 🟢 低 | 必要最小限のファイルのみ読む |
| テンプレートが古くなる | 🟡 中 | 🔴 高 | 動的生成、バージョン管理 |
| フレームワーク検出失敗 | 🟡 中 | 🟡 中 | フォールバック、手動設定 |

**対策の優先度:**
1. 🔴 高影響・高確率 → 最優先で対策
2. 🔴 高影響・中確率 → 対策必須
3. 🟡 中影響 → 可能な範囲で対策
4. 🟢 低影響 → 監視のみ

---

#### 6.2 運用リスク

**問題:**
- フレームワークのバージョンアップ
- Capacitorの仕様変更
- iOSの仕様変更

**対策:**
- バージョン番号を明記
- 定期的なアップデート
- コミュニティからのフィードバック

---

## 🎯 MVP（Minimum Viable Product）の定義

### 「使うに値する」最小限の機能

#### 必須機能（v0.1）

1. **detect_web_framework**
   - Vite (React/Vue) 検出
   - Next.js 検出
   - CRA 検出
   - エラー時の適切なメッセージ

2. **generate_ios_migration_spec**
   - Vite用仕様書生成
   - Next.js用仕様書生成
   - COMMON_ISSUES.mdへのリンク

3. **generate_capacitor_config**
   - 基本的なcapacitor.config.ts生成
   - フレームワークに応じたwebDir設定

#### 不要な機能（後回し）

- ❌ 完璧なエラー処理（基本的なもので十分）
- ❌ すべてのフレームワーク対応（Vite/Next.jsで十分）
- ❌ 自動修正機能（提案だけで十分）
- ❌ GUI（CLIで十分）

---

## 📐 実装の設計原則

### 1. KISS（Keep It Simple, Stupid）

**シンプルに保つ:**
```typescript
// ❌ 複雑
class FrameworkDetectorFactory {
  private static instance: FrameworkDetectorFactory;
  private detectors: Map<string, AbstractDetector>;

  private constructor() { ... }

  public static getInstance(): FrameworkDetectorFactory { ... }
}

// ✅ シンプル
const detectors = [
  new ViteDetector(),
  new NextJsDetector(),
];

async function detect(path: string) {
  for (const detector of detectors) {
    const result = await detector.detect(path);
    if (result) return result;
  }
  return null;
}
```

---

### 2. YAGNI（You Aren't Gonna Need It）

**必要になるまで実装しない:**
```typescript
// ❌ 過剰設計
interface CacheStrategy { ... }
interface RetryStrategy { ... }
interface LoggingStrategy { ... }

// ✅ 必要最小限
async function detectFramework(path: string): Promise<ProjectInfo> {
  // シンプルな実装
}
```

---

### 3. Fail Fast

**早く失敗する:**
```typescript
async function generateSpec(projectPath: string) {
  // 早期チェック
  if (!await exists(projectPath)) {
    throw new Error(`Path not found: ${projectPath}`);
  }

  const pkg = await readPackageJson(projectPath);
  if (!pkg) {
    throw new Error('package.json not found');
  }

  // メイン処理
}
```

---

### 4. Single Responsibility

**1関数1責務:**
```typescript
// ✅ 良い設計
async function detectFramework(path: string): Promise<string> { ... }
async function detectVersion(path: string, framework: string): Promise<string> { ... }
async function detectUILibrary(path: string): Promise<string> { ... }

// これらを組み合わせる
async function analyzeProject(path: string): Promise<ProjectInfo> {
  const framework = await detectFramework(path);
  const version = await detectVersion(path, framework);
  const uiLibrary = await detectUILibrary(path);

  return { framework, version, uiLibrary };
}
```

---

## 🚀 実装の優先順位

### Phase 0: 準備（30分）
- [x] 問題整理（本ドキュメント）
- [ ] TypeScript環境構築
- [ ] MCP SDK統合

### Phase 1: コア機能（2時間）
- [ ] ViteDetector実装
- [ ] NextJsDetector実装
- [ ] 仕様書生成（テンプレート）

### Phase 2: MCPツール（1時間）
- [ ] detect_web_framework
- [ ] generate_ios_migration_spec

### Phase 3: テスト（1時間）
- [ ] Spark Vaultで動作確認
- [ ] エラーケースのテスト

### Phase 4: ドキュメント（30分）
- [ ] README更新
- [ ] 使い方の説明

**合計: 約5時間**

---

## ✅ 品質チェックリスト

### 実装完了時の確認項目

#### 機能性
- [ ] Viteプロジェクトを正しく検出できる
- [ ] Next.jsプロジェクトを正しく検出できる
- [ ] 仕様書が生成される
- [ ] capacitor.config.tsが生成される

#### パフォーマンス
- [ ] 検出が1秒以内に完了する
- [ ] 大規模プロジェクトでも動作する

#### エラーハンドリング
- [ ] 存在しないパスでエラーが出る
- [ ] package.jsonがない場合のエラーが分かりやすい
- [ ] 未対応フレームワークの場合の案内が適切

#### コード品質
- [ ] 型定義が完全
- [ ] 関数が適切に分割されている
- [ ] コメントが適切
- [ ] テストが通る

#### ドキュメント
- [ ] READMEが最新
- [ ] 使い方が明確
- [ ] エラーメッセージにドキュメントリンク

#### 実用性（最重要）
- [ ] **実際に使って便利か？**
- [ ] **手動より速いか？**
- [ ] **エラーは分かりやすいか？**

---

## 🎯 最後に：「使うに値する」とは

### 良いツールの条件

1. **問題を解決する**
   - 「iOS化したい」という明確なニーズ
   - 手動でやるより速く、確実

2. **信頼できる**
   - エラーが少ない
   - エラー時の対処が明確
   - 破壊的操作をしない

3. **学習コストが低い**
   - 使い方がすぐ分かる
   - ドキュメントが充実
   - エラーメッセージが親切

4. **保守可能**
   - コードが読みやすい
   - 拡張しやすい
   - テストがある

### 実装時の自問

**常に自問すること:**
- 「これは本当に必要か？」
- 「手動より速いか？」
- 「ユーザーは理解できるか？」

**この問いに "Yes" と答えられない機能は実装しない。**

---

**このガイドに従って、「使うに値する」MCPサーバーを実装します。**

最終更新: 2025-11-15
