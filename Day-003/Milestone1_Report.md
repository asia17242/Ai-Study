# 🎙️ Voice Finance (語音記帳軟體) — Milestone 1 驗收報告

---

## 📋 專案基本定義與目標
* **專案名稱**：`voice_finance` (Day 003)
* **前端框架**：Flutter (Dart) - 支援 Android, iOS, Windows, macOS, Linux, Web
* **後端核心**：Python (Gemini API / Gemini 2.5-Flash)
* **架構規範**：Clean Architecture + BLoC 狀態管理 + Hive 本地資料儲存

---

## 🏆 里程碑 1：已達成之開發成果 (DoD)

### 1. 📂 解決 Git 衝突與統一命名
* **命名規範統一**：解決了本地與 GitHub 遠端大小寫不敏感引起的 `DAY-003` 衝突，統一命名為 **`Day-003`**，檔案已全部推送至 Git 倉庫。

### 2. 📱 全功能響應式 UI 開發 (`home_page.dart`)
採用 `responsive_framework` 整合，以 **`600px`** 寬度為流暢切換斷點：
* **行動端視圖 (< 600px)**：
  - 採用**單欄簡潔排版**。
  - 上方為「今日記帳明細列表」（透過 `ListView.builder` 渲染 Mock 資料，包含：餐飲食品、交通出行等明細卡片）。
  - 底部固定一個大型圓形語音記帳懸浮按鈕 (`FloatingActionButton.large`），帶有麥克風圖示。
* **桌面端/平板視圖 (>= 600px)**：
  - 採用**雙欄左右佈局**（左欄寬度占 60%，右欄寬度占 40%）。
  - **左欄**：顯示完整的記帳明細列表與歷史紀錄，便於大螢幕閱讀。
  - **右欄上方**：統計圖表佔位區 (`Card` 元件與圓餅圖 icon)，作為未來圖表整合接口。
  - **右欄下方**：常駐型智能語音輸入控制面板（內含大尺寸漸層色麥克風按鈕與錄音狀態提示文字）。
* **程式碼品質**：全頁面適當使用 `const` 修飾符優化記憶體，排除 `dynamic` 動態變數類型以獲得嚴格型別安全，拉動視窗時自適應流暢，無任何 Overflow Error。

### 3. 🐍 新版 Python 語意解析 PoC (`backend_poc`)
在專案根目錄下建立了 `backend_poc`，用於預先驗證 Gemini 2.5-Flash 的語意理解與結構化輸出能力：
* **依賴配置**：[`requirements.txt`](./voice_finance/backend_poc/requirements.txt) 指定使用最新的 `google-genai==0.1.1` SDK。
* **解析核心**：[`parser.py`](./voice_finance/backend_poc/parser.py)：
  - 使用最新的 `Client` 串接 **`gemini-2.5-flash`** 模型。
  - 設定 `response_mime_type="application/json"` 並結合 Pydantic 的 `TransactionSchema` 作為 **`response_schema`**，確保輸出為 100% 格式嚴謹且安全的 JSON。
  - **標準輸出欄位**：包含 `date` (YYYY-MM-DD)、`type`、`amount`、`category`、`merchant`、`payment_method` (規定為：現金/信用卡/電子支付)、`tags` (陣列)、`description`、`raw_text`。
  - **相對時間與台灣口語特化**：
    - 設定系統時間基準為 **`2026年6月13日`**，當說出「昨天」時能自動解算為 `2026-06-12`。
    - 能精確辨識台灣本土品牌（如：全聯、中油、大買家）與在地行動支付（如：中油Pay、Line Pay，並精確歸類為 `電子支付`）。

---

## 📁 專案目錄結構

```
Day-003/
├── README.md                     # 專案首頁說明文件
└── voice_finance/
    ├── lib/                      # Flutter 原始碼
    │   ├── core/                 # 核心層 (主題, 依賴注入, 工具類)
    │   │   ├── di/
    │   │   ├── services/         # API 串接服務
    │   │   └── theme/
    │   └── features/record/      # 記帳業務模組
    │       ├── data/             # 資料層 (Hive 本地資料源)
    │       ├── domain/           # 領域層 (Entity 與 UseCases)
    │       └── presentation/     # 展示層 (Pages, Widgets, BLoC)
    │           ├── bloc/
    │           ├── pages/        # 包含 responsive home_page.dart
    │           └── widgets/      # 語音與列表 UI 元件
    ├── backend_poc/              # Python AI 語意解析驗證端
    │   ├── parser.py             # 語音記帳解析 PoC (Gemini 2.5-flash)
    │   └── requirements.txt      # 依賴套件定義
    └── pubspec.yaml              # Flutter 套件管理
```

---

## 🧪 測試與驗證數據

### 語意解析驗證輸出
執行 `python backend_poc/parser.py` 解析台灣在地口語的實際 JSON 輸出結果：

#### 測試案例 1
* **輸入口語**："昨天去中油用中油Pay加滿油花了800塊"
* **輸出結果**：
```json
{
  "date": "2026-06-12",
  "type": "expense",
  "amount": 800,
  "category": "交通出行",
  "merchant": "中油",
  "payment_method": "電子支付",
  "tags": ["中油Pay", "加油"],
  "description": "加滿油",
  "raw_text": "昨天去中油用中油Pay加滿油花了800塊"
}
```

#### 測試案例 2
* **輸入口語**："今天中午去全聯刷信用卡買鮮奶和麵包花了250元"
* **輸出結果**：
```json
{
  "date": "2026-06-13",
  "type": "expense",
  "amount": 250,
  "category": "餐飲食品",
  "merchant": "全聯",
  "payment_method": "信用卡",
  "tags": ["鮮奶", "麵包", "超商超市"],
  "description": "買鮮奶和麵包",
  "raw_text": "今天中午去全聯刷信用卡買鮮奶和麵包花了250元"
}
```

---

## 📅 下一步規劃 (Milestone 2)
1. **麥克風錄音整合**：將 Flutter 端的 `speech_to_text` 實機麥克風權限及錄音流程進行全面優化。
2. **圖表開發**：將分析頁面的 `fl_chart` 動態串接，並在桌面端右側同步即時渲染。
3. **雲端備份同步**：實作多端資料庫的雲端備份功能。
