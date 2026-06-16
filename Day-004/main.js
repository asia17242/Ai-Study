// 商家資料庫
const merchants = [
  { id: "m1", name: "台灣中油", aliases: ["中油", "cpc", "加油", "汽油"], tags: ["cpc_pay"], icon: "⛽" },
  { id: "m2", name: "全聯福利中心", aliases: ["全聯", "pxmart", "買菜", "超市"], tags: ["px_pay"], icon: "🥦" },
  { id: "m3", name: "7-11 統一超商", aliases: ["711", "7-11", "小七", "seven"], tags: ["seven_eleven"], icon: "🏪" },
  { id: "m4", name: "全家便利商店", aliases: ["全家", "family", "familymart"], tags: ["family_mart"], icon: "🏪" },
  { id: "m5", name: "POYA 寶雅", aliases: ["寶雅", "poya", "美妝"], tags: ["poya"], icon: "💄" },
  { id: "m6", name: "康是美", aliases: ["cosmed", "藥妝"], tags: ["cosmed"], icon: "💊" },
  { id: "m7", name: "Foodpanda 熊貓外送", aliases: ["foodpanda", "熊貓", "外送"], tags: ["food_delivery"], icon: "🐼" },
  { id: "m8", name: "Uber Eats", aliases: ["uber", "ubereats", "吳柏毅"], tags: ["food_delivery"], icon: "🛵" },
  { id: "m9", name: "家樂福", aliases: ["carrefour", "量販店"], tags: ["carrefour"], icon: "🛒" }
];

// 優惠規則庫
const rules = [
  { merchantTag: "cpc_pay", cardName: "中油Pay 聯名卡", method: "中油Pay (線上儲值再加油)", rate: 6.8, tip: "🧙‍♂️ 使用魔力儲值中油Pay享最高6.8%！", warning: "直接刷實體卡魔法回饋會變低喔！" },
  { merchantTag: "px_pay", cardName: "國泰世華 CUBE 卡", method: "PX Pay 刷卡", rate: 2.0, tip: "🧚 精靈叮嚀：CUBE App 要切換至【集精選】權益！", warning: "別用全支付綁CUBE卡在全聯刷，會降到 0.3%！" },
  { merchantTag: "px_pay", cardName: "台新銀行 GoGo 卡", method: "全支付 綁定消費", rate: 3.8, tip: "🍃 無腦賺取 3.8% 大自然能量，注意每期上限。", warning: "全聯不支援 LINE Pay 與街口支付回饋！" },
  { merchantTag: "seven_eleven", cardName: "國泰世華 CUBE 卡", method: "icash Pay 綁定消費", rate: 2.0, tip: "🔮 切換至【集精選】方案，並透過 icash Pay 召喚回饋。", warning: "7-11 無法直接刷國泰實體卡，一定要用 icash Pay。" },
  { merchantTag: "family_mart", cardName: "台新銀行 GoGo 卡", method: "全盈+PAY 綁定消費", rate: 3.8, tip: "🪄 全盈+PAY在全家施展 3.8% 回饋魔法。", warning: "注意卡片需成功認證才符合精選資格。" },
  { merchantTag: "poya", cardName: "台新銀行 GoGo 卡", method: "POYA Pay 綁定消費", rate: 3.8, tip: "✨ 將卡片綁入寶雅 POYA Pay 享 3.8% 點數回饋。", warning: "直接使用實體卡刷卡可能沒有高回饋喔。" },
  { merchantTag: "cosmed", cardName: "國泰世華 CUBE 卡", method: "實體卡 / 行動支付", rate: 3.3, tip: "🌳 切換至【樂饗購】方案，康是美享 3.3% 小樹點無上限！", warning: "每天限切換一次權益，結帳前要確認好。" },
  { merchantTag: "food_delivery", cardName: "台新銀行 FlyGo 卡", method: "App 內直接刷卡", rate: 5.0, tip: "🦅 雙外送飛行必備 FlyGo，享 5% 精選回饋！", warning: "需完成 Richart 帳戶自動扣繳卡費的魔法任務。" },
  { merchantTag: "food_delivery", cardName: "國泰世華 CUBE 卡", method: "App 內直接刷卡", rate: 3.3, tip: "🍕 切換至【樂饗購】方案，享外送 3.3% 小樹點回饋。", warning: "適合當作 FlyGo 額度滿上限後的魔法備用方案。" },
  { merchantTag: "carrefour", cardName: "台新銀行 GoGo 卡", method: "全支付 綁定消費", rate: 3.8, tip: "🐶 家樂福支援全支付，綁定大黑狗卡穩拿 3.8%。", warning: "購買大額家電時，請注意每期回饋點數的容器上限。" }
];

const userWallet = ["中油Pay 聯名卡", "國泰世華 CUBE 卡", "台新銀行 GoGo 卡", "台新銀行 FlyGo 卡"];
const defaultShortcuts = ["m1", "m2", "m3", "m4"]; 

document.addEventListener("DOMContentLoaded", () => {
  renderQuickButtons();
  initModalEvents();
  
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchMerchant(e.target.value);
  });
});

function getSavedShortcuts() {
  const saved = localStorage.getItem("ghibli_shortcuts");
  return saved ? JSON.parse(saved) : defaultShortcuts;
}

function renderQuickButtons() {
  const container = document.getElementById("quickButtonsContainer");
  const savedIds = getSavedShortcuts();
  
  container.innerHTML = "";
  savedIds.forEach(id => {
    const merchant = merchants.find(m => m.id === id);
    if (merchant) {
      const btn = document.createElement("button");
      btn.innerHTML = `${merchant.icon} ${merchant.name.split(" ")[0]}`;
      btn.onclick = () => quickSearch(merchant.name);
      container.appendChild(btn);
    }
  });
}

function quickSearch(name) {
  document.getElementById('searchInput').value = name;
  searchMerchant(name);
}

function initModalEvents() {
  const modal = document.getElementById("configModal");
  const openBtn = document.getElementById("openConfigBtn");
  const saveBtn = document.getElementById("saveConfigBtn");
  const group = document.getElementById("merchantCheckboxGroup");

  openBtn.onclick = () => {
    const savedIds = getSavedShortcuts();
    group.innerHTML = "";
    
    merchants.forEach(m => {
      const isChecked = savedIds.includes(m.id) ? "checked" : "";
      group.innerHTML += `
        <label class="checkbox-item">
          <input type="checkbox" value="${m.id}" ${isChecked} onchange="limitCheckbox(this)">
          <span>${m.icon} ${m.name.split(" ")[0]}</span>
        </label>
      `;
    });
    modal.style.display = "flex"; // 點擊時強制用 flex 居中顯示
  };

  saveBtn.onclick = () => {
    const checkedBoxes = group.querySelectorAll("input[type='checkbox']:checked");
    const newIds = Array.from(checkedBoxes).map(cb => cb.value);
    
    if (newIds.length === 0) {
      alert("🧓 森林長老提醒：請至少保留一個快捷葉子喔！");
      return;
    }
    
    localStorage.setItem("ghibli_shortcuts", JSON.stringify(newIds));
    renderQuickButtons();
    modal.style.display = "none"; // 關閉視窗
  };

  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
}

function limitCheckbox(el) {
  const group = document.getElementById("merchantCheckboxGroup");
  const checkedCount = group.querySelectorAll("input[type='checkbox']:checked").length;
  if (checkedCount > 4) {
    el.checked = false;
    alert("🍃 魔法葉子最多只能容納 4 個最常用商場喔！");
  }
}

function searchMerchant(query) {
  const cleanQuery = query.toLowerCase().trim();
  const resultContainer = document.getElementById('resultContainer');

  if (!cleanQuery) {
    resultContainer.innerHTML = '<p class="placeholder-text">🐈‍⬛ 點擊上方的魔法葉子，或輸入店名讓黑炭精靈幫你算算...</p>';
    return;
  }

  const matchedMerchant = merchants.find(m => 
    m.name.toLowerCase().includes(cleanQuery) || 
    m.aliases.some(alias => alias.includes(cleanQuery))
  );

  if (!matchedMerchant) {
    resultContainer.innerHTML = '<p class="error-text">🔍 找不到該商場... 目前支援：中油、全聯、超商、寶雅、康是美、外送和家樂福。</p>';
    return;
  }

  const matchedRules = rules
    .filter(r => matchedMerchant.tags.includes(r.merchantTag) && userWallet.includes(r.cardName))
    .sort((a, b) => b.rate - a.rate);

  renderResults(matchedMerchant.name, matchedRules);
}

function renderResults(merchantName, matchedRules) {
  const resultContainer = document.getElementById('resultContainer');
  
  if (matchedRules.length === 0) {
    resultContainer.innerHTML = `<h2>✨ ${merchantName}</h2><p class="placeholder-text">🛡️ 您的皮夾目前在此通路無優化回饋。</p>`;
    return;
  }

  let html = `<h2>✨ ${merchantName} 魔法支付排序：</h2>`;
  
  matchedRules.forEach((rule, index) => {
    const medal = index === 0 ? "🏆 第一推薦 🏆" : index === 1 ? "🥈 第二推薦" : "🥉 第三推薦";
    html += `
      <div class="result-card ${index === 0 ? 'top-choice' : ''}">
        <div class="card-header">
          <span class="medal">${medal}</span>
          <span class="rate">${rule.rate}% 能量</span>
        </div>
        <div class="card-body">
          <p><strong>魔法工具：</strong> ${rule.method}</p>
          <p><strong>搭配卡片：</strong> ${rule.cardName}</p>
          <p class="tip">${rule.tip}</p>
          <p class="warning">${rule.warning}</p>
        </div>
      </div>
    `;
  });
  
  resultContainer.innerHTML = html;
}
