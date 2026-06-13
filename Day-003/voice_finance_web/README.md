# 🌐 Voice Finance — Web Platform PoC

這是 **Voice Finance** 的網頁版 PoC (Proof of Concept) 實作。基於 **FastAPI** 後端與原生 HTML5/CSS3/JavaScript 打造，展示了核心的語音記帳解析能力。

## 🎬 實作展示 (Web App Walkthrough)

下面是 Web 版本的實際互動操作展示：

![Voice Finance Live Demo](../demo.webp)

*圖：Web 版記帳分析圓餅圖統計*
![Voice Finance Final Dashboard State](../screenshot.png)

## ✨ 特色功能

1. **口語語音記帳**：
   - 串接瀏覽器原生 Web Speech API。
   - 支援語音識別轉文字，並自動傳送至後端進行 AI 語意分析。
2. **AI 語意解析**：
   - 串接 **Google Gemini API** (`gemini-2.5-flash` 或是 `gemini-1.5-flash`)。
   - 自動辨識交易金額、收支類別 (餐飲、交通、購物等)、付款方式、交易時間 (支援「昨天」、「前天」等相對時間轉換)。
   - **Mock 備用模式**：若未填入 Gemini API Key，後端將自動切換為規則型 Mock 解析引擎，方便離線開發測試。
3. **響應式毛玻璃介面 (Glassmorphism UI)**：
   - 原生 CSS3 變數與 Flex/Grid 佈局。
   - 精美的深色漸層背景與磨砂玻璃質感。
4. **動態數據統計與圖表**：
   - 帳戶結餘、總收入、總支出即時計算。
   - 原生 SVG 動態繪製的 Doughnut Chart (甜甜圈圓餅圖) 與圖例顯示。
5. **本地儲存備份**：
   - 整合 `localStorage`，確保重新整理或關閉瀏覽器後記帳明細不遺失。

---

## 🛠️ 快速開始

### 1. 安裝環境與依賴
請確保你的系統中已安裝 Python 3.10+。

```bash
# 進入網頁版專案目錄
cd voice_finance_web

# 安裝所需 Python 套件
pip install -r requirements.txt
```

### 2. 設定環境變數
在 `voice_finance_web` 目錄下建立 `.env` 檔案，並填入您的 Gemini API Key：

```ini
GEMINI_API_KEY=your_gemini_api_key_here
```
*(注意：若留空，系統將會啟動 **Mock 測試模式**，依然可以點選內建的範例句型進行記帳與圖表動態展示。)*

### 3. 啟動伺服器
```bash
python app.py
```
伺服器啟動後，將會預設運行在：
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

在瀏覽器中開啟該網址即可體驗 Voice Finance 智能記帳！

---

## 📂 專案檔案結構

* [app.py](file:///c:/Users/po546/Desktop/Cloud%20Ai%20Study/Antigravity%20IDE/Ai-Study/Day-003/voice_finance_web/app.py) - FastAPI 後端，處理語音解析 API 路由並載入 Gemini SDK。
* [static/index.html](file:///c:/Users/po546/Desktop/Cloud%20Ai%20Study/Antigravity%20IDE/Ai-Study/Day-003/voice_finance_web/static/index.html) - 主頁面結構，設計各區塊版面與功能按鈕。
* [static/style.css](file:///c:/Users/po546/Desktop/Cloud%20Ai%20Study/Antigravity%20IDE/Ai-Study/Day-003/voice_finance_web/static/style.css) - 精美毛玻璃風格與動畫的 Vanilla CSS 樣式表。
* [static/app.js](file:///c:/Users/po546/Desktop/Cloud%20Ai%20Study/Antigravity%20IDE/Ai-Study/Day-003/voice_finance_web/static/app.js) - 語音辨識、API 呼叫與 SVG 圓餅圖繪製邏輯。
