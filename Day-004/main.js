// 台灣結帳神算子 - 核心邏輯與資料庫 (最後更新：2026/06/15)

// 1. 擴充後的商家資料庫 (Merchants)
const merchants = [
  { id: "m1", name: "台灣中油", aliases: ["中油", "cpc", "加油", "汽油"], tags: ["cpc_pay"] },
  { id: "m2", name: "全聯福利中心", aliases: ["全聯", "pxmart", "買菜", "超市"], tags: ["px_pay"] },
  { id: "m3", name: "7-11 統一超商", aliases: ["711", "7-11", "小七", "seven", "seven eleven", "7-eleven"], tags: ["seven_eleven"] },
  { id: "m4", name: "全家便利商店", aliases: ["全家", "family", "familymart"], tags: ["family_mart"] },
  { id: "m5", name: "POYA 寶雅", aliases: ["寶雅", "poya", "美妝", "生活百貨"], tags: ["poya"] },
  { id: "m6", name: "康是美", aliases: ["cosmed", "藥妝", "cosme", "美妝"], tags: ["cosmed"] },
  { id: "m7", name: "Foodpanda 熊貓外送", aliases: ["foodpanda", "熊貓", "外送", "外賣", "panda", "delivery"], tags: ["food_delivery"] },
  { id: "m8", name: "Uber Eats", aliases: ["uber", "ubereats", "吳柏毅", "外送", "外賣", "delivery"], tags: ["food_delivery"] },
  { id: "m9", name: "家樂福", aliases: ["carrefour", "天天都便宜", "量販店", "家樂福超市", "家樂福線上購物"], tags: ["carrefour"] }
];

// 2. 擴充後的優惠規則庫 (Rules)
const rules = [
  { merchantTag: "cpc_pay", cardName: "中油Pay 聯名卡", method: "中油Pay (線上先儲值再加油)", rate: 6.8, tip: "線上儲值中油Pay享最高6.8%！", warning: "直接刷實體卡回饋會變低喔！" },
  { merchantTag: "px_pay", cardName: "國泰世華 CUBE 卡", method: "PX Pay 刷卡", rate: 2.0, tip: "記得 CUBE App 要切換至【集精選】權益！", warning: "絕對不要用全支付綁CUBE卡，在全聯會慘變 0.3%！" },
  { merchantTag: "px_pay", cardName: "台新銀行 GoGo 卡", method: "全支付 綁定消費", rate: 3.8, tip: "基本無腦 3.8% 入袋，注意當期帳單任務與上限。", warning: "全聯不支援 LINE Pay 與街口支付刷卡回饋！" },

  // --- 新增超商規則 ---
  {
    merchantTag: "seven_eleven",
    cardName: "國泰世華 CUBE 卡",
    method: "icash Pay 綁定消費",
    rate: 2.0,
    tip: "開啟 CUBE App 切換至【集精選】方案，並綁定 icash Pay 結帳。",
    warning: "7-11 無法直接刷國泰實體信用卡，一定要透過 icash Pay。"
  },
  {
    merchantTag: "family_mart",
    cardName: "台新銀行 GoGo 卡",
    method: "全盈+PAY 綁定消費",
    rate: 3.8,
    tip: "使用全盈+PAY在全家結帳，享 3.8% 台新Point回饋。",
    warning: "注意全盈+PAY需綁定特定卡片才算在精選通路中。"
  },

  // --- 新增美妝生活百貨規則 ---
  {
    merchantTag: "poya",
    cardName: "台新銀行 GoGo 卡",
    method: "POYA Pay 綁定消費",
    rate: 3.8,
    tip: "將 GoGo 卡綁入寶雅官方 POYA Pay 享精選 3.8%。",
    warning: "直接刷實體卡可能不計入高回饋範疇。"
  },
  {
    merchantTag: "cosmed",
    cardName: "國泰世華 CUBE 卡",
    method: "實體卡 / 行動支付",
    rate: 3.3,
    tip: "CUBE App 請切換至【樂饗購】方案，康是美享 3.3% 小樹點無上限！",
    warning: "結帳前務必確認當天切對方案，每天限切換一次權益。"
  },

  // --- 新增外送平台規則 ---
  {
    merchantTag: "food_delivery",
    cardName: "台新銀行 FlyGo 卡",
    method: "App 內直接綁卡刷卡",
    rate: 5.0,
    tip: "雙外送平台（熊貓/UberEats）無腦刷 FlyGo 享 5% 精選回饋！",
    warning: "需完成當期任務（如設定 Richart 帳戶自動扣繳卡費）。"
  },
  {
    merchantTag: "food_delivery",
    cardName: "國泰世華 CUBE 卡",
    method: "App 內直接綁卡刷卡",
    rate: 3.3,
    tip: "切換至【樂饗購】方案，外送平台同享 3.3% 回饋無上限。",
    warning: "適合 FlyGo 卡當期額度刷滿後的備用神卡。"
  },

  // --- 新增量販店規則 ---
  {
    merchantTag: "carrefour",
    cardName: "台新銀行 GoGo 卡",
    method: "全支付 綁定消費",
    rate: 3.8,
    tip: "家樂福支援全支付，綁定 GoGo 卡一樣能拿滿 3.8%！",
    warning: "若是買大額家電，注意每期回饋上限。"
  }
];

// DOM 元素選取
const searchInput = document.getElementById("searchInput");
const clearInputBtn = document.getElementById("clearInput");
const resultContainer = document.getElementById("resultContainer");

// 快速搜尋功能 (提供給 HTML 上的 onclick 呼叫)
window.quickSearch = function(storeName) {
  if (searchInput) {
    searchInput.value = storeName;
    handleSearch(storeName);
    toggleClearButton();
  }
};

// 顯示或隱藏清除按鈕
function toggleClearButton() {
  if (searchInput.value.trim().length > 0) {
    clearInputBtn.classList.add("visible");
  } else {
    clearInputBtn.classList.remove("visible");
  }
}

// 監聽輸入框變化
searchInput.addEventListener("input", (e) => {
  const query = e.target.value;
  toggleClearButton();
  handleSearch(query);
});

// 監聽清除按鈕點擊
clearInputBtn.addEventListener("click", () => {
  searchInput.value = "";
  toggleClearButton();
  resetToPlaceholder();
  searchInput.focus();
});

// 重設為初始狀態
function resetToPlaceholder() {
  resultContainer.innerHTML = `
    <div class="placeholder-card">
      <span class="placeholder-icon">💡</span>
      <p class="placeholder-text">請在上方輸入或點選商場查看最優支付</p>
    </div>
  `;
}

// 根據 Tag 對應類別名稱與圖標
function getCategoryByTags(tags) {
  if (tags.includes("cpc_pay")) return "⛽ 交通加油";
  if (tags.includes("px_pay") || tags.includes("carrefour")) return "🛒 超市量販";
  if (tags.includes("seven_eleven") || tags.includes("family_mart")) return "🏪 便利商店";
  if (tags.includes("poya")) return "💄 美妝生活";
  if (tags.includes("cosmed")) return "💊 藥妝保健";
  if (tags.includes("food_delivery")) return "🛵 外送平台";
  return "🛍️ 特約商店";
}

// 搜尋核心邏輯
function handleSearch(query) {
  const cleanQuery = query.trim().toLowerCase();
  
  if (!cleanQuery) {
    resetToPlaceholder();
    return;
  }

  // 尋找匹配的商店 (名稱與別名模糊搜尋)
  const matches = merchants.filter(store => {
    return store.name.toLowerCase().includes(cleanQuery) || 
           cleanQuery.includes(store.name.toLowerCase()) ||
           store.aliases.some(alias => alias.toLowerCase().includes(cleanQuery) || cleanQuery.includes(alias.toLowerCase()));
  });

  if (matches.length === 0) {
    renderNoResults(query);
  } else {
    renderResults(matches);
  }
}

// 渲染無結果狀態
function renderNoResults(query) {
  const supportedList = merchants.map(m => m.name).join('、');
  
  resultContainer.innerHTML = `
    <div class="no-result-card" style="animation: slideUp 0.4s ease-out;">
      <span class="no-result-icon">🧐</span>
      <h3 class="no-result-title">目前尚未收錄「${escapeHtml(query)}」</h3>
      <p class="no-result-text">您可以試著搜尋：全聯、中油、7-11、全家、寶雅、康是美、外送或家樂福。</p>
      <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted); max-width: 90%;">
        <strong>目前已支援通路：</strong><br>${supportedList}
      </div>
    </div>
  `;
}

// 渲染匹配結果
function renderResults(matchedMerchants) {
  resultContainer.innerHTML = "";

  matchedMerchants.forEach((merchant) => {
    // 建立商店標題
    const storeHeader = document.createElement("div");
    storeHeader.className = "store-result-header";
    const categoryName = getCategoryByTags(merchant.tags);
    storeHeader.innerHTML = `
      <h2 class="store-name"><span>${merchant.name}</span></h2>
      <span class="store-category">${categoryName}</span>
    `;
    resultContainer.appendChild(storeHeader);

    // 尋找該商店所有的優惠規則，並依回饋率降序排列
    const merchantRules = rules.filter(rule => merchant.tags.includes(rule.merchantTag));
    merchantRules.sort((a, b) => b.rate - a.rate);

    if (merchantRules.length === 0) {
      const emptyCard = document.createElement("div");
      emptyCard.className = "payment-card";
      emptyCard.innerHTML = `
        <div class="card-tip-text">
          <span class="tip-icon">ℹ️</span>
          <span>此商店目前尚未建立具體優惠刷卡規則。</span>
        </div>
      `;
      resultContainer.appendChild(emptyCard);
      return;
    }

    // 建立推薦卡片
    merchantRules.forEach((rule, index) => {
      const card = document.createElement("div");
      
      // 判斷是否為高回饋 (大於等於 3.8%)
      const isHighReward = rule.rate >= 3.8;
      card.className = `payment-card rank-${index} ${isHighReward ? 'high-reward' : ''}`;
      
      // 依金銀銅等級給予小徽章
      let badgeClass = "normal";
      let badgeLabel = "推薦支付";
      if (index === 0) {
        badgeClass = "gold";
        badgeLabel = "第一推薦";
      } else if (index === 1) {
        badgeClass = "silver";
        badgeLabel = "第二推薦";
      }

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-badge ${badgeClass}">${badgeLabel}</span>
            <h3 class="card-title">${escapeHtml(rule.cardName)}</h3>
            <div class="card-subtitle">${escapeHtml(rule.method)}</div>
          </div>
          <div class="reward-badge">
            <span class="reward-pct">${rule.rate}</span>
            <span class="reward-unit">%</span>
          </div>
        </div>
        
        <div class="card-tip-text">
          <span class="tip-icon">💡</span>
          <span>${escapeHtml(rule.tip)}</span>
        </div>
        
        ${rule.warning ? `
        <div class="card-warning">
          <span class="warning-icon">⚠️</span>
          <span>${escapeHtml(rule.warning)}</span>
        </div>
        ` : ''}
      `;
      
      card.style.animationDelay = `${index * 0.1}s`;
      resultContainer.appendChild(card);
    });
  });
}

// 防範 XSS 注入
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
