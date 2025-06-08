# 🔐 vitepress-auth-server

本專案是一個概念性實作，示範如何透過 VitePress 頁面的 **Frontmatter 權限標記** 與 **伺服器中介層 Middleware**，為 VitePress 套上基本的權限控管機制。

適用於以下情境：

- 技術驗證 RBAC 是否可套用於靜態網站
- 開發者希望保留 Markdown 編輯流程但需具備角色控管能力
- 企業內部文件平台需具備登入與權限驗證的 PoC 範本

## 🎯 專案目標

- **中介層控管 VitePress 編譯產物**：支援 `.html`、`.md.js` 等需授權控管的靜態資源
- **以 Frontmatter 標記頁面角色需求**：透過 `role:` 欄位描述授權規則
- **統一權限策略**：以 fallback role 控制未標記頁面的預設行為
- **Google 登入整合**：提供準開箱即用的登入流程
- **YAML 驅動的角色配置**：提供最低限度的角色與使用者綁定方式

## 🧩 核心程式結構與責任

### 📄 `src/services/PageAccessControlRepoDefault.ts`

- 解析 `.md.js` 資源中的 `frontmatter`
- 取出 `role:` 欄位設定以決定授權規則

### 📄 `src/services/ResourceClassifierDefault.ts`

- 將請求路徑分類為：
  - 可公開的靜態資源（如 `.css`, `.png`）
  - 可跳過授權檢查的 JS（非 `.md.js`）
  - 需授權的 HTML 或 `.md.js` 頁面
- 提供分類結果給授權中介層使用

### 📄 `src/routes/ServeStatic.ts`

- 結合：
  - `staticPlugin` 作為靜態檔案伺服器
  - `onBeforeHandle` 作為授權攔截中介層
- 流程順序：
  1. 解碼 URL path，透過 `ResourceClassifier` 判斷資源型別
  2. 若為受控資源，查詢 `PageAccessControlRepo` 與 `UserRoleRepo`
  3. 根據使用者角色決定是否允許提供該檔案

## 🚀 使用方式

### 1. 編譯你的 VitePress 專案

```bash
vitepress build
```

將產物移至本專案的 `public/` 資料夾：

```bash
cp -r YOUR_VITEPRESS_PROJECT/.vitepress/dist ./public
```

### 2. 設定使用者角色（`user-roles.yaml`）

```yaml
- userId: alice@example.com
  roles:
    - internal
    - admin
- userId: bob@example.com
  roles:
    - reader
```

### 3. 標記受控頁面權限（在 Markdown 檔案開頭的 frontmatter 區塊加入 `role:`）

```markdown
---
role:
  - internal
  - reader
---
```

> ✅ **這段稱為 YAML frontmatter**，是 VitePress 用來描述頁面中繼資料的區塊。
> ✅ 系統會根據 `role:` 欄位定義的角色清單，判斷登入使用者是否有權閱讀該頁面。
> ❗ 若該欄位缺漏，則採用 `ACCESS_CONTROL_FALLBACK_ROLE` 作為預設權限需求。

例如：

- `role: [public]` → 所有人皆可訪問（包含未登入者）
- `role: [authed]` → 只要登入即可訪問
- `role: [internal, admin]` → 僅限具備任一指定角色的使用者

### 4. 執行伺服器

```bash
bun run start
```

或使用 Docker：

```bash
docker build -t vitepress-auth .
docker run -p 3000:3000 --env-file .env vitepress-auth
```

## 🔐 權限控管機制

- 使用者登入後，其 email 即作為系統中的 `userId`
- 每位使用者可對應多個角色，透過 `user-roles.yaml` 設定
- 每頁存取權限由該頁 `role:` frontmatter 決定
- 若未標記 `role:`，則由 `ACCESS_CONTROL_FALLBACK_ROLE` 決定其存取邏輯

## ⚙️ 環境變數說明（`.env`）

| 變數名稱                       | 說明                                              |
| ------------------------------ | ------------------------------------------------- |
| `LOG_LEVEL`                    | 預設為 `info`，可設為 `debug` 觀察授權過程        |
| `BASE_URL`                     | 應與 VitePress 專案設定一致（預設為 `/`）         |
| `COOKIE_PREFIX`                | Cookie 名稱前綴（例如 `vitepress_auth`）          |
| `COOKIE_SECURE`                | 是否啟用 Secure Cookie（部署環境建議 `true`）     |
| `GOOGLE_CLIENT_ID`             | Google OAuth 憑證                                 |
| `GOOGLE_CLIENT_SECRET`         | Google OAuth 憑證                                 |
| `PUBLIC_ROLE`                  | 代表「完全公開」頁面使用的角色名稱（如 `public`） |
| `AUTHENTICATED_ROLE`           | 表示「只要登入即可」的角色名稱（如 `authed`）     |
| `ACCESS_CONTROL_FALLBACK_ROLE` | 未標記 `role:` 的頁面，預設要求的角色             |

## ✨ 登入流程說明

1. 使用者瀏覽 `/login`

   - 若已登入 → 顯示歡迎頁
   - 若未登入 → 302 redirect 到 Google 授權挑戰頁

2. Google 驗證成功後導向 `/callback`

   - 後端驗證 token，解出使用者 email 作為 ID
   - 建立 session，寫入 cookie

3. 每次請求頁面時

   - 根據路徑判斷是否為受控資源
   - 若是，則進行角色比對授權
   - 否則直接提供靜態資源

4. `/logout` 可清除登入狀態

## 🧪 測試與開發建議

- 使用 `.env.local` 搭配本地測試用 Google OAuth 憑證
- 初期建議將 `ACCESS_CONTROL_FALLBACK_ROLE=authed`，確保所有頁面預設需登入
- 若需測試特定角色頁面，請手動修改 `user-roles.yaml`
- 若需進行登入 mock 測試，有兩種方式：

  - 🧪 自行修改 `src/routes/Login.ts`，加入 fake login endpoint
  - 🧪 實作 `src/services/IdentityResolver.ts` 的替代版本，回傳固定使用者資料

- 本專案僅為概念驗證，實際部署前請審慎評估資安風險

## 📜 授權

MIT License. 本專案歡迎 fork、改寫並用於內部用途，亦可作為 Docker-based 文件平台的登入驗證模組。
