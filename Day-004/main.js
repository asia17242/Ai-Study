// 1. 擴充後的商家資料庫 (Merchants)
const merchants = [
  { id: "m1", name: "台灣中油", aliases: ["中油", "cpc", "加油", "汽油", "中油直營"], tags: ["cpc_pay"] },
  { id: "m2", name: "全聯福利中心", aliases: ["全聯", "pxmart", "買菜", "超市", "生鮮"], tags: ["px_pay"] },
  { id: "m3", name: "7-11 統一超商", aliases: ["711", "7-11", "小七", "seven", "統一超商"], tags: ["seven_eleven"] },
  { id: "m4", name: "全家便利商店", aliases: ["全家", "family", "familymart", "全家超商"], tags: ["family_mart"] },
  { id: "m5", name: "POYA 寶雅", aliases: ["寶雅", "poya", "美妝", "生活百貨"], tags: ["poya"] },
  { id: "m6", name: "康是美", aliases: ["cosmed", "藥妝", "康是美藥妝"], tags: ["cosmed"] },
  { id: "m7", name: "Foodpanda 熊貓外送", aliases: ["foodpanda", "熊貓", "外送", "熊貓外送"], tags: ["food_delivery"] },
  { id: "m8", name: "Uber Eats", aliases: ["uber", "ubereats", "吳柏毅", "烏伯毅"], tags: ["food_delivery"] },
  { id: "m9", name: "家樂福", aliases: ["carrefour", "天天都便宜", "家樂福量販"], tags: ["carrefour"] }
];

// 2. 擴充後的優惠規則庫 (Rules)
const rules = [
  // --- 原有通路規則 ---
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

// 3. 使用者擁有的皮夾卡片 (預設常用三張神卡全開)
const userWallet = ["中油Pay 聯名卡", "國泰世華 CUBE 卡", "台新銀行 GoGo 卡", "台新銀行 FlyGo 卡"];

// 4. 監聽輸入框
document.getElementById('searchInput').addEventListener('input', (e) => {
  searchMerchant(e.target.value);
});

// 快捷鍵功能
function quickSearch(name) {
  document.getElementById('searchInput').value = name;
  searchMerchant(name);
}
window.quickSearch = quickSearch;

// 5. 核心搜尋與排序演算法
function searchMerchant(query) {
  const cleanQuery = query.toLowerCase().trim();
  const resultContainer = document.getElementById('resultContainer');

  if (!cleanQuery) {
    resultContainer.innerHTML = `
      <div class="placeholder-card">
        <span class="placeholder-icon">💡</span>
        <p class="placeholder-text">請在上方輸入或點選商場查看最優支付</p>
      </div>
    `;
    return;
  }

  // 模糊搜尋名稱與別名
  const matchedMerchant = merchants.find(m =>
    m.name.toLowerCase().includes(cleanQuery) ||
    m.aliases.some(alias => alias.includes(cleanQuery))
  );

  if (!matchedMerchant) {
    resultContainer.innerHTML = '<p class="error-text">找不到該商場，目前支援：中油、全聯、7-11、全家、寶雅、康是美、外送、家樂福</p>';
    return;
  }

  // 篩選出同時符合商家標籤與皮夾持有的最優規則
  const matchedRules = rules
    .filter(r => matchedMerchant.tags.includes(r.merchantTag) && userWallet.includes(r.cardName))
    .sort((a, b) => b.rate - a.rate);

  renderResults(matchedMerchant.name, matchedRules);
}

// 6. 渲染結果到 HTML 畫面上
function renderResults(merchantName, matchedRules) {
  const resultContainer = document.getElementById('resultContainer');

  if (matchedRules.length === 0) {
    resultContainer.innerHTML = `<h2>${escapeHtml(merchantName)}</h2><p class="placeholder-text">您的皮夾卡片目前在此通路無特定優化回饋，建議使用一般無腦刷卡片。</p>`;
    return;
  }

  let html = `<h2>${escapeHtml(merchantName)} 最強支付排序：</h2>`;

  matchedRules.forEach((rule, index) => {
    const medal = index === 0 ? "🥇 第一推薦" : index === 1 ? "🥈 第二推薦" : "🥉 第三推薦";
    html += `
      <div class="result-card ${index === 0 ? 'top-choice' : ''}">
        <div class="card-header">
          <span class="medal">${medal}</span>
          <span class="rate">${rule.rate}% 回饋</span>
        </div>
        <div class="card-body">
          <p><strong>使用工具：</strong> ${escapeHtml(rule.method)}</p>
          <p><strong>搭配卡片：</strong> ${escapeHtml(rule.cardName)}</p>
          <p class="tip">💡 攻略：${escapeHtml(rule.tip)}</p>
          <p class="warning">⚠️ 防呆：${escapeHtml(rule.warning)}</p>
        </div>
      </div>
    `;
  });

  resultContainer.innerHTML = html;
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