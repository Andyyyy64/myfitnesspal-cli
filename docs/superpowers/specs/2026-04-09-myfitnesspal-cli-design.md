# MyFitnessPal CLI - Design Spec

## Overview

MyFitnessPalの内部Web APIをリバースエンジニアリングし、CLIツールとして無料機能を全てコマンドライン化する。AI agentからの利用も想定し、`--json`フラグで構造化出力をサポート。

## Repository

- 名前: `myfitnesspal-cli`
- 場所: 独立リポジトリ（GitHub public）
- パッケージ名: `myfitnesspal-cli`（npm公開可能な構成）

## Tech Stack

- TypeScript + Node.js
- `commander` — コマンド定義
- `cli-table3` — テーブル出力
- `inquirer` — インタラクティブ入力
- ビルトイン `fetch` — API呼び出し（Node 18+）

## Architecture: Core SDK + CLI

```
myfitnesspal-cli/
├── src/
│   ├── client/           # Core SDK（API層）
│   │   ├── index.ts      # MFPClient クラス（エントリ）
│   │   ├── auth.ts       # 認証（ログイン、クッキー管理）
│   │   ├── diary.ts      # 食事日記 CRUD
│   │   ├── food.ts       # 食品検索
│   │   ├── exercise.ts   # 運動検索・記録
│   │   ├── measurement.ts # 体重・測定
│   │   ├── water.ts      # 水分記録
│   │   ├── goals.ts      # 栄養目標
│   │   └── types.ts      # 共通型定義
│   ├── commands/          # CLI層（commanderベース）
│   │   ├── auth.ts
│   │   ├── diary.ts
│   │   ├── search.ts
│   │   ├── log.ts
│   │   ├── weight.ts
│   │   ├── water.ts
│   │   ├── exercise.ts
│   │   └── goals.ts
│   ├── utils/
│   │   ├── config.ts     # ~/.config/mfp-cli/ の読み書き
│   │   └── output.ts     # テーブル/JSON出力切り替え
│   └── index.ts          # CLIエントリポイント
├── package.json
├── tsconfig.json
└── README.md
```

**Core SDK (`src/client/`):**
- `MFPClient` クラスがエントリポイント
- コンストラクタで認証情報（セッションクッキー）を受け取る
- 各メソッドは `fetch` でMFPの内部APIを叩く
- レスポンスは型付きオブジェクトで返す
- 将来MCP化する際はこの層を直接呼び出す

**CLI (`src/commands/`):**
- `commander` でコマンド定義
- MFPClientのメソッドを呼んで結果を出力するだけ
- ビジネスロジックは持たない

## Authentication

### 方式1: 自動ログイン
```
mfp login
```
- メール/パスワード入力（`--email`, `--password` またはプロンプト）
- `/api/auth/csrf` でCSRFトークン取得
- `/api/auth/callback/credentials` にPOSTしてセッションクッキー取得
- `~/.config/mfp-cli/auth.json` に保存

### 方式2: 手動クッキーセット
```
mfp auth set-cookie <token>
```
- Cloudflareチャレンジ等で自動ログインが使えない場合のフォールバック

### 認証状態確認
```
mfp auth status
```
- `/api/auth/session` を叩いて有効性確認

### 設定ファイル (`~/.config/mfp-cli/auth.json`)
```json
{
  "sessionToken": "eyJhbG...",
  "buildId": "WUqel2fuJzZCpcOfgs7xR",
  "buildIdUpdatedAt": "2026-04-09T15:00:00Z",
  "userId": "101867535101485"
}
```

## Commands

### 認証
| コマンド | 説明 |
|---------|------|
| `mfp login` | メール/パスワードでログイン |
| `mfp auth set-cookie <token>` | セッションクッキー手動セット |
| `mfp auth status` | 認証状態確認 |

### 食品検索
| コマンド | 説明 | オプション |
|---------|------|-----------|
| `mfp search <query>` | 食品検索 | `--page`, `--per-page` |

### 食事記録
| コマンド | 説明 | オプション |
|---------|------|-----------|
| `mfp log <food> [amount]` | 食事記録追加（インタラクティブ） | `--meal`, `--date` |
| `mfp log <foodId> --serving-size <n> --servings <n>` | ID指定で直接登録 | `--meal`, `--date` |
| `mfp diary [date]` | 日記表示（デフォルト今日） | `--json` |
| `mfp diary delete <id>` | 食事記録削除 | |

### 体重・測定
| コマンド | 説明 | オプション |
|---------|------|-----------|
| `mfp weight [value]` | 体重記録（値なしで最新表示） | `--date`, `--history`, `--limit` |

### 水分
| コマンド | 説明 | オプション |
|---------|------|-----------|
| `mfp water [cups]` | 水分記録（値なしで今日の表示） | `--date` |

### 運動
| コマンド | 説明 | オプション |
|---------|------|-----------|
| `mfp exercise search <query>` | 運動検索 | |
| `mfp exercise log <id>` | 運動記録 | `--duration`, `--calories` |

### 栄養目標
| コマンド | 説明 | オプション |
|---------|------|-----------|
| `mfp goals` | 栄養目標表示 | `--date` |

### 全コマンド共通
- `--json` フラグでJSON出力（AI agent向け）
- `--date` はデフォルト今日

## MFP Internal API Endpoints

### Authentication
- `GET /api/auth/session` — セッション情報
- `GET /api/auth/csrf` — CSRFトークン
- `POST /api/auth/callback/credentials` — ログイン

### Food Diary
- `GET /api/services/diary/read_diary?date=YYYY-MM-DD` — 日記取得
- `GET /api/services/diary/read_day?date=YYYY-MM-DD` — 日メタデータ
- `GET /api/services/diary/read_water?date=YYYY-MM-DD` — 水分取得
- `GET /api/services/diary/nutrient_goals?date=YYYY-MM-DD` — 栄養目標
- `POST /api/services/diary` — 食事記録追加
- `DELETE /api/services/diary/:id` — 食事記録削除

### Food Search
- `GET /_next/data/{buildId}/food/calorie-chart-nutrition-facts.json?params={query}` — 食品検索

### Exercise
- `GET /api/services/exercises/search?search={term}` — 運動検索
- `PUT /api/services/exercises/:id` — 運動更新
- `DELETE /api/services/exercises/:id` — 運動削除

### Measurements
- `GET /api/user-measurements/measurements` — 測定値取得
- `PUT /api/user-measurements/measurements` — 測定値記録
- `DELETE /api/user-measurements/measurements/:id` — 測定値削除

### Other
- `GET /api/services/nutrient-goals` — 栄養目標
- `GET /api/services/users` — ユーザー情報

## buildId Handling

MFPの `/_next/data/{buildId}/` 系エンドポイント（食品検索）はNext.jsのビルドIDが必要。

- 初回に `https://www.myfitnesspal.com/` のHTMLから `"buildId":"xxx"` を正規表現で抽出
- `auth.json` にキャッシュ、24時間で再取得（デプロイで変わるため）

## Output Format

**デフォルト（人間向け）:** `cli-table3` でテーブル表示

**`--json`（AI agent向け）:** 構造化JSONを標準出力に出力
```json
{
  "success": true,
  "data": { ... }
}
```

## Error Handling

- 401/403 → 「セッション期限切れ。`mfp login` で再認証してください」
- ネットワークエラー → エラーメッセージ表示
- 404 → API変更の可能性を示唆

## Future

- MCPサーバー化（`src/mcp/` を追加、Core SDKを再利用）
- npm公開（`npx myfitnesspal-cli` で即実行可能）
