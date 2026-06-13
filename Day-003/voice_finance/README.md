# 📱 Voice Finance — Flutter Cross-Platform Client

這是 **Voice Finance** 的跨平台前端應用程式，使用 **Flutter** 與 **Dart** 打造，支援 iOS、Android、Windows、macOS 和 Web 等多個平台。

## 🏗️ 系統架構 (Architecture)

本專案採用 **Clean Architecture (乾淨架構)** 分層設計，搭配 **BLoC (Business Logic Component)** 進行狀態管理，確保程式碼具備高測試性、低耦合性與可維護性。

```
┌────────────────────────────────────────────────────────┐
│                      Presentation Layer                │
│             (Pages, Widgets, BLoC/Cubit, UI)           │
├────────────────────────────────────────────────────────┤
│                        Domain Layer                    │
│             (Entities, Use Cases, Repositories Interfaces)
├────────────────────────────────────────────────────────┤
│                        Data Layer                      │
│             (Models, Repositories Impls, Data Sources) │
└────────────────────────────────────────────────────────┘
```

### 資料夾結構
- `lib/core/`：核心公用模組（主題樣式、常數設定、系統工具、網路請求客戶端）。
- `lib/features/`：各功能模組（例如：記帳功能、語音辨識功能、支出分析功能）。
  - `data/`：資料源定義與模型轉換。
  - `domain/`：核心業務邏輯、實體 (Entities) 與使用案例 (Use Cases)。
  - `presentation/`：BLoC 狀態處理與 UI 頁面/元件。

---

## ✨ 核心功能

1. **語音即時輸入**：整合 Speech-to-Text 原生 API，支援跨平台即時語音轉文字。
2. **AI 智能解析與分類**：呼叫後端 API 將口語轉換為結構化記帳 JSON（包含金額、分類、備註、付款方式）。
3. **明細紀錄 (Transactions)**：本地 SQLite/Hive 資料庫進行交易記錄 CRUD。
4. **支出視覺化分析**：透過動態統計圖表（圓餅圖與趨勢圖）分析消費佔比。

---

## 🚀 快速開始

### 1. 環境準備
請確保您的系統已安裝：
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (>= 3.10)
- Dart SDK (>= 3.0)
- 對應平台開發工具（Android Studio / Xcode / VS Code）

### 2. 安裝套件依賴
```bash
# 進入 Flutter 專案路徑
cd voice_finance

# 下載 pub 套件
flutter pub get
```

### 3. 設定 API Key
複製專案中的環境變數範例：
```bash
cp .env.example .env
```
並填入你的伺服器 API 終端地址或 Gemini API 金鑰。

### 4. 運行應用程式
```bash
flutter run                  # 運行於預設模擬器或實體裝置
flutter run -d chrome        # 運行於網頁瀏覽器
flutter run -d windows       # 運行於 Windows 桌面端
```
