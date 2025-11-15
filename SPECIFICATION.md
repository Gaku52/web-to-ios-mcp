# Web to iOS MCP - 技術仕様書

**バージョン**: 1.0.0
**作成日**: 2025-11-15
**作成者**: Gaku52

---

## 1. プロジェクト概要

### 1.1 目的
既存のWebアプリケーション（Vite、Next.js、React等）をiOSアプリに変換するプロセスを自動化・支援するMCPサーバーを開発する。

### 1.2 背景
- Webアプリ → iOSアプリの需要が高まっている
- Capacitorの存在は知られているが、設定が煩雑
- フレームワークごとに設定方法が異なり、初心者には難しい
- 正確な仕様書を手動で作成するのは時間がかかり、ミスも発生する

### 1.3 ターゲットユーザー
- Webアプリを開発した個人開発者
- iOS展開を検討しているスタートアップ
- クロスプラットフォーム開発に興味のあるエンジニア
- Capacitorを使いたいが設定に困っている開発者

---

## 2. 技術アーキテクチャ

### 2.1 システム構成

```
┌─────────────────────────────────────┐
│         Claude Code CLI             │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Web to iOS MCP Server       │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Framework Detector    │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Spec Generator        │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Config Generator      │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Readiness Checker     │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      User's Web Project             │
│  (Vite/Next.js/React/Vue等)         │
└─────────────────────────────────────┘
```

### 2.2 ディレクトリ構造

```
web-to-ios-mcp/
├── src/
│   ├── index.ts                  # MCPサーバーエントリーポイント
│   ├── server.ts                 # MCP Server実装
│   │
│   ├── detectors/                # フレームワーク検出
│   │   ├── base-detector.ts      # 基底クラス
│   │   ├── vite-detector.ts      # Vite検出
│   │   ├── nextjs-detector.ts    # Next.js検出
│   │   ├── cra-detector.ts       # CRA検出
│   │   └── index.ts              # 検出ロジック統合
│   │
│   ├── generators/               # 生成機能
│   │   ├── spec-generator.ts     # 仕様書生成
│   │   ├── config-generator.ts   # Capacitor設定生成
│   │   ├── checklist-generator.ts # チェックリスト生成
│   │   └── templates/            # テンプレート
│   │       ├── vite-spec.md
│   │       ├── nextjs-spec.md
│   │       └── capacitor-config.ts.template
│   │
│   ├── checkers/                 # 環境チェック
│   │   ├── xcode-checker.ts      # Xcode確認
│   │   ├── cocoapods-checker.ts  # CocoaPods確認
│   │   └── build-checker.ts      # ビルド確認
│   │
│   ├── tools/                    # MCPツール定義
│   │   ├── detect-framework.ts
│   │   ├── generate-spec.ts
│   │   ├── generate-config.ts
│   │   └── analyze-readiness.ts
│   │
│   ├── types/                    # 型定義
│   │   ├── framework.ts
│   │   ├── project-info.ts
│   │   └── index.ts
│   │
│   └── utils/                    # ユーティリティ
│       ├── file-utils.ts
│       ├── json-parser.ts
│       └── logger.ts
│
├── tests/                        # テスト
│   ├── detectors/
│   ├── generators/
│   └── integration/
│
├── docs/                         # ドキュメント
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── CONTRIBUTING.md
│
├── package.json
├── tsconfig.json
├── .gitignore
├── LICENSE
├── README.md
└── SPECIFICATION.md              # 本ドキュメント
```

---

## 3. コア機能詳細

### 3.1 フレームワーク検出（Framework Detection）

#### 3.1.1 検出フロー

```
1. package.json を読み込み
   ↓
2. dependencies/devDependencies を解析
   ↓
3. 設定ファイルの存在確認
   - vite.config.ts/js
   - next.config.js
   - react-scripts (CRA)
   ↓
4. ビルドスクリプトを解析
   ↓
5. フレームワーク特定
```

#### 3.1.2 Vite検出

**検出条件:**
- `package.json` に `"vite"` が存在
- `vite.config.ts` または `vite.config.js` が存在

**取得情報:**
```typescript
interface ViteProjectInfo {
  framework: 'vite';
  version: string;
  uiLibrary: 'react' | 'vue' | 'svelte' | 'vanilla';
  buildCommand: string;
  buildOutputDir: string; // vite.config.ts の build.outDir
  plugins: string[];
  routing: 'react-router' | 'vue-router' | 'none';
}
```

**実装:**
```typescript
export class ViteDetector extends BaseDetector {
  async detect(projectPath: string): Promise<ViteProjectInfo | null> {
    // 1. package.json確認
    const pkg = await this.readPackageJson(projectPath);
    if (!pkg.dependencies?.vite && !pkg.devDependencies?.vite) {
      return null;
    }

    // 2. vite.config確認
    const viteConfig = await this.findConfig(projectPath, ['vite.config.ts', 'vite.config.js']);
    if (!viteConfig) {
      return null;
    }

    // 3. UIライブラリ検出
    const uiLibrary = this.detectUILibrary(pkg);

    // 4. ビルド設定解析
    const buildOutputDir = await this.parseBuildOutputDir(viteConfig) || 'dist';

    return {
      framework: 'vite',
      version: pkg.dependencies.vite || pkg.devDependencies.vite,
      uiLibrary,
      buildCommand: pkg.scripts?.build || 'vite build',
      buildOutputDir,
      plugins: await this.detectPlugins(viteConfig),
      routing: this.detectRouting(pkg),
    };
  }
}
```

#### 3.1.3 Next.js検出

**検出条件:**
- `package.json` に `"next"` が存在
- `next.config.js` または `next.config.mjs` が存在

**取得情報:**
```typescript
interface NextJsProjectInfo {
  framework: 'nextjs';
  version: string;
  routerType: 'app' | 'pages';
  buildCommand: string;
  buildOutputDir: string; // 通常は 'out'（static export）
  hasApiRoutes: boolean;
  exportConfig: 'static' | 'dynamic';
}
```

---

### 3.2 仕様書生成（Specification Generation）

#### 3.2.1 Vite用仕様書テンプレート

生成される仕様書の構成：

```markdown
# [App Name] - iOS変換仕様書（Vite版）

## 1. 現在の構成
- フレームワーク: Vite [version]
- UIライブラリ: React/Vue
- ビルド出力: dist/
- ルーティング: React Router

## 2. 必要な環境
- Xcode: 15.0+
- CocoaPods: 1.12+
- Node.js: 18.0+

## 3. Capacitorインストール手順
\`\`\`bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
npm install @capacitor/app @capacitor/haptics ...
\`\`\`

## 4. Capacitor初期化
\`\`\`bash
npx cap init "[App Name]" "[Bundle ID]" --web-dir=dist
\`\`\`

## 5. Vite設定変更
... (詳細な設定)

## 6. ビルド&同期
\`\`\`bash
npm run build
npx cap sync ios
npx cap open ios
\`\`\`

## 7. トラブルシューティング
...
```

#### 3.2.2 動的生成ロジック

```typescript
export class SpecGenerator {
  async generate(projectInfo: ProjectInfo, options: SpecOptions): Promise<string> {
    const template = await this.loadTemplate(projectInfo.framework);

    return this.renderTemplate(template, {
      appName: options.appName,
      bundleId: options.bundleId,
      framework: projectInfo.framework,
      version: projectInfo.version,
      buildOutputDir: projectInfo.buildOutputDir,
      // ... その他の変数
    });
  }

  private async loadTemplate(framework: string): Promise<string> {
    const templatePath = path.join(__dirname, 'templates', `${framework}-spec.md`);
    return fs.readFile(templatePath, 'utf-8');
  }

  private renderTemplate(template: string, vars: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
  }
}
```

---

### 3.3 Capacitor設定生成（Config Generation）

#### 3.3.1 生成される設定ファイル

**capacitor.config.ts:**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '{{bundleId}}',
  appName: '{{appName}}',
  webDir: '{{webDir}}',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '{{primaryColor}}',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
```

#### 3.3.2 生成ロジック

```typescript
export class ConfigGenerator {
  async generate(options: ConfigOptions): Promise<string> {
    const config: CapacitorConfig = {
      appId: options.bundleId,
      appName: options.appName,
      webDir: options.webDir,
      bundledWebRuntime: false,
      server: {
        androidScheme: 'https',
        iosScheme: 'https',
      },
      ios: {
        contentInset: 'automatic',
        scrollEnabled: true,
      },
      plugins: this.generatePluginConfig(options),
    };

    return this.formatAsTypeScript(config);
  }

  private generatePluginConfig(options: ConfigOptions): any {
    const plugins: any = {};

    // 常に含めるプラグイン
    plugins.SplashScreen = {
      launchShowDuration: 2000,
      backgroundColor: options.primaryColor || '#8b5cf6',
      showSpinner: false,
    };

    plugins.StatusBar = {
      style: 'dark',
      backgroundColor: '#ffffff',
    };

    return plugins;
  }
}
```

---

### 3.4 移行準備チェック（Readiness Analysis）

#### 3.4.1 チェック項目

```typescript
interface ReadinessCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message?: string;
}

interface ReadinessResult {
  ready: boolean;
  checks: ReadinessCheck[];
  recommendations: string[];
}
```

#### 3.4.2 チェッカー実装

```typescript
export class ReadinessAnalyzer {
  async analyze(projectPath: string): Promise<ReadinessResult> {
    const checks: ReadinessCheck[] = [];

    // 1. Xcode確認
    checks.push(await this.checkXcode());

    // 2. CocoaPods確認
    checks.push(await this.checkCocoaPods());

    // 3. Node.js/npm確認
    checks.push(await this.checkNodeVersion());

    // 4. ビルド成功確認
    checks.push(await this.checkBuild(projectPath));

    // 5. ディスク容量確認
    checks.push(await this.checkDiskSpace());

    const allPass = checks.every(c => c.status === 'pass');

    return {
      ready: allPass,
      checks,
      recommendations: this.generateRecommendations(checks),
    };
  }

  private async checkXcode(): Promise<ReadinessCheck> {
    try {
      const result = await exec('xcodebuild -version');
      return {
        name: 'Xcode installed',
        status: 'pass',
        message: result.stdout.split('\n')[0],
      };
    } catch (error) {
      return {
        name: 'Xcode installed',
        status: 'fail',
        message: 'Xcode not found. Please install from App Store.',
      };
    }
  }
}
```

---

## 4. MCPツール定義

### 4.1 ツール一覧

#### 4.1.1 detect_web_framework

```typescript
{
  name: 'detect_web_framework',
  description: 'Detect the web framework and configuration of a project',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the web project directory',
      },
    },
    required: ['projectPath'],
  },
}
```

#### 4.1.2 generate_ios_migration_spec

```typescript
{
  name: 'generate_ios_migration_spec',
  description: 'Generate detailed iOS migration specification document',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the web project directory',
      },
      appName: {
        type: 'string',
        description: 'Name of the iOS app (e.g., "Spark Vault")',
      },
      bundleId: {
        type: 'string',
        description: 'Bundle identifier (e.g., "com.ogadix.sparkvault")',
      },
    },
    required: ['projectPath', 'appName', 'bundleId'],
  },
}
```

#### 4.1.3 generate_capacitor_config

```typescript
{
  name: 'generate_capacitor_config',
  description: 'Generate Capacitor configuration file',
  inputSchema: {
    type: 'object',
    properties: {
      appName: { type: 'string' },
      appId: { type: 'string' },
      webDir: { type: 'string' },
      framework: { type: 'string' },
      primaryColor: { type: 'string', description: 'Optional primary color for splash screen' },
    },
    required: ['appName', 'appId', 'webDir'],
  },
}
```

#### 4.1.4 analyze_migration_readiness

```typescript
{
  name: 'analyze_migration_readiness',
  description: 'Check if the environment is ready for iOS migration',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Path to the web project directory',
      },
    },
    required: ['projectPath'],
  },
}
```

---

## 5. 実装計画

### 5.1 Phase 1: 基本機能（Week 1-2）

**Week 1:**
- [x] プロジェクト設計・仕様策定
- [ ] TypeScript環境構築
- [ ] MCP SDK統合
- [ ] Vite検出機能実装

**Week 2:**
- [ ] Next.js検出機能実装
- [ ] CRA検出機能実装
- [ ] 仕様書生成（Viteテンプレート）
- [ ] 仕様書生成（Next.jsテンプレート）

### 5.2 Phase 2: 拡張機能（Week 3-4）

**Week 3:**
- [ ] Capacitor設定生成
- [ ] 移行準備チェック機能
- [ ] 統合テスト

**Week 4:**
- [ ] ドキュメント整備
- [ ] サンプルプロジェクトでのテスト
- [ ] npm公開準備

---

## 6. テスト戦略

### 6.1 ユニットテスト

```typescript
describe('ViteDetector', () => {
  it('should detect Vite project correctly', async () => {
    const detector = new ViteDetector();
    const result = await detector.detect('./test-projects/vite-react');

    expect(result).not.toBeNull();
    expect(result?.framework).toBe('vite');
    expect(result?.uiLibrary).toBe('react');
  });

  it('should return null for non-Vite project', async () => {
    const detector = new ViteDetector();
    const result = await detector.detect('./test-projects/nextjs');

    expect(result).toBeNull();
  });
});
```

### 6.2 統合テスト

実際のプロジェクト（Spark Vault）を使用して：
1. フレームワーク検出
2. 仕様書生成
3. Capacitor設定生成
4. 移行準備チェック

すべてのフローをテスト。

---

## 7. 非機能要件

### 7.1 パフォーマンス
- フレームワーク検出: 1秒以内
- 仕様書生成: 3秒以内
- 移行準備チェック: 5秒以内

### 7.2 信頼性
- エラーハンドリング: すべての外部依存（ファイル読み込み、コマンド実行等）
- ログ出力: デバッグ用の詳細ログ

### 7.3 保守性
- TypeScript使用による型安全性
- コードカバレッジ80%以上
- ESLint + Prettierによるコード品質維持

---

## 8. 将来の拡張

### 8.1 v1.1
- Astro対応
- SvelteKit対応
- より詳細な依存関係分析

### 8.2 v2.0（Android対応）
- リポジトリ名変更: `web-to-mobile-mcp`
- Android変換機能追加
- iOS/Android共通最適化

---

**本仕様書は実装しながら随時更新されます。**

最終更新: 2025-11-15
