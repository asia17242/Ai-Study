// 台灣結帳神算子 - 核心邏輯與資料庫 (最後更新：2026/06/15)

// 本地通路與刷卡支付策略資料庫
const storeDatabase = [
  {
    id: "cpc",
    names: ["台灣中油", "中油", "cpc", "加油", "加油站", "汽油", "柴油", "直營"],
    displayName: "台灣中油",
    category: "⛽ 交通加油",
    methods: [
      {
        name: "中油Pay 儲值捷利卡",
        reward: "5.5%",
        rewardSuffix: "起",
        badge: "最強攻略",
        badgeType: "gold",
        steps: [
          "使用「中油Pay」線上儲值行動捷利卡（享儲值紅利 2% ~ 4%）",
          "結帳時出示中油Pay條碼扣款（再享消費點數回饋與中油會員點數 1.5%）",
          "推薦綁定：富邦中油聯名卡，享週一線上儲值加碼"
        ],
        tip: "捷利卡常有特定儲值加碼，點數可於中油折抵消費。"
      },
      {
        name: "街口支付 / LINE Pay 綁定高回饋卡",
        reward: "3.8%",
        rewardSuffix: "回饋",
        badge: "行動支付推薦",
        badgeType: "silver",
        steps: [
          "使用街口支付或 LINE Pay 綁定「台新 @GoGo 卡」",
          "結帳時出示條碼完成付款（享 3.8% 網購/支付加碼回饋）"
        ],
        tip: "部分民營加盟站可能無法支援掃碼支付，建議優先選擇中油直營站。"
      },
      {
        name: "實體信用卡無腦刷",
        reward: "2.0%",
        rewardSuffix: "現金回饋",
        badge: "實體卡推薦",
        badgeType: "normal",
        steps: [
          "直接刷「聯邦吉鶴卡」（國內無腦 2%）或「富邦 J 卡」",
          "或於例假日刷「台新玫瑰Giving卡」（享節假日最高 3% 回饋）"
        ],
        tip: "玫瑰Giving卡 3% 回饋需綁定台新帳戶自扣，且每期帳單回饋上限 3,000 元。"
      }
    ]
  },
  {
    id: "pxmart",
    names: ["全聯福利中心", "全聯", "pxmart", "pxpay", "全支付", "福利中心", "超市"],
    displayName: "全聯福利中心",
    category: "🛒 超市量販",
    methods: [
      {
        name: "全支付 (PX Pay Plus) 綁指定信用卡",
        reward: "4.5%",
        rewardSuffix: "點數回饋",
        badge: "週末最狂",
        badgeType: "gold",
        steps: [
          "將全支付 App 綁定「國泰世華」、「玉山」或「台新」信用卡",
          "於週六、週日全聯店內消費，單筆滿 1,000 元贈福利點/全點（約 2.5% ~ 4.5% 折抵回饋）"
        ],
        tip: "全聯店內直接刷卡無回饋，強烈建議使用全支付綁定信用卡或儲值金消費。"
      },
      {
        name: "PX Pay 儲值/消費",
        reward: "3.0%",
        rewardSuffix: "回饋",
        badge: "日常首選",
        badgeType: "silver",
        steps: [
          "下載 PX Pay App，搭配活動日（通常為週末）綁定信用卡儲值或直接消費",
          "滿額贈送全聯福利點數（10 點可折抵 1 元，相當於 2% ~ 3% 回饋）"
        ],
        tip: "點數無使用期限，可在全聯結帳時直接全額折抵消費。"
      },
      {
        name: "悠遊卡 / 悠遊聯名卡",
        reward: "2.0%",
        rewardSuffix: "自動加值回饋",
        badge: "感應支付",
        badgeType: "normal",
        steps: [
          "使用「第一銀行 Living 綠活卡」或「永豐大戶聯名卡」等悠遊聯名卡",
          "於全聯收銀台以悠遊卡感應扣款，觸發自動加值享 2% ~ 5% 回饋"
        ],
        tip: "注意部分悠遊聯名卡自動加值回饋需登錄或有每月回饋上限。"
      }
    ]
  },
  {
    id: "seven",
    names: ["7-11", "711", "統一超商", "7-eleven", "ibon", "小七", "超商", "便利商店"],
    displayName: "7-ELEVEN",
    category: "🏪 便利商店",
    methods: [
      {
        name: "橘子支付 綁定指定卡",
        reward: "6.0%",
        rewardSuffix: "起",
        badge: "超商高回饋",
        badgeType: "gold",
        steps: [
          "使用「橘子支付 (Gama Pay)」App，綁定玉山 U Bear 卡或特定高回饋卡",
          "在 7-11 結帳時出示橘子支付條碼扣款",
          "可獲得帳單折抵及點數回饋（約 4% ~ 8% 不等）"
        ],
        tip: "橘子支付在超商常有單筆限額或每月上限，使用前可至橘子官網確認。"
      },
      {
        name: "台新 Pay / LINE Pay + 黑狗卡",
        reward: "3.8%",
        rewardSuffix: "無腦拿",
        badge: "行動支付推薦",
        badgeType: "silver",
        steps: [
          "使用 LINE Pay 或台新 Pay 綁定「台新 @GoGo 卡」",
          "結帳時出示條碼付款，享 3.8% 台新 Point 回饋"
        ],
        tip: "必須綁定指定數位帳戶扣繳卡費且使用電子帳單，方可享有 3.8% 精選通路加碼。"
      },
      {
        name: "國泰世華 CUBE 卡 (集精選)",
        reward: "3.0%",
        rewardSuffix: "小樹點",
        badge: "日常首選",
        badgeType: "normal",
        steps: [
          "刷實體 CUBE 卡，或綁定 Apple Pay / 掃碼支付",
          "當天務必在國泰世華 CUBE App 中將權益方案切換為「集精選」",
          "即可獲得 3% 小樹點回饋無上限"
        ],
        tip: "小樹點 1 點折抵新台幣 1 元消費，可透過國泰 App 即時折抵。"
      }
    ]
  },
  {
    id: "familymart",
    names: ["全家", "全家便利商店", "familymart", "全盈", "famipay", "famiport", "超商", "便利商店"],
    displayName: "全家便利商店",
    category: "🏪 便利商店",
    methods: [
      {
        name: "全盈+PAY 綁定指定信用卡",
        reward: "3.8% - 10.0%",
        rewardSuffix: "高額回饋",
        badge: "最強利器",
        badgeType: "gold",
        steps: [
          "在全家 App 中啟用「全盈+PAY」",
          "綁定「新光寰宇現金回饋卡」（全盈+PAY 享最高 10% 現金回饋，每月上限 100 元）",
          "或綁定「台新 @GoGo 卡」享 3.8% 回饋"
        ],
        tip: "新光寰宇卡 10% 限額較低，適合日常買早餐、飲料使用。"
      },
      {
        name: "FamiPay 儲值/扣款 + 指定信用卡",
        reward: "3.0%",
        rewardSuffix: "起",
        badge: "全家專屬",
        badgeType: "silver",
        steps: [
          "使用 FamiPay 綁定「新光多核心信用卡」或「聯邦指定卡」",
          "於全家結帳時出示 FamiPay 條碼或進行 App 內付費"
        ],
        tip: "FamiPay 僅能在全家通路使用，但可繳納多種民生代收費用（水電、學費等）。"
      },
      {
        name: "街口支付 / LINE Pay 綁定高回饋卡",
        reward: "2.0% - 3.8%",
        rewardSuffix: "回饋",
        badge: "無腦首選",
        badgeType: "normal",
        steps: [
          "使用 LINE Pay、街口支付或 Apple Pay 綁定一般高回饋信用卡",
          "直接掃碼或感應付款，快速累積消費回饋"
        ],
        tip: "悠遊卡自動加值在全家同樣享有部分悠遊聯名卡的自動加值優惠。"
      }
    ]
  },
  {
    id: "carrefour",
    names: ["家樂福", "carrefour", "家樂福錢包", "家樂福量販", "家樂福超市"],
    displayName: "家樂福",
    category: "🛒 超市量販",
    methods: [
      {
        name: "家樂福錢包儲值 + 玉山家樂福聯名卡",
        reward: "3.3% - 5.0%",
        badge: "聯名卡最優",
        badgeType: "gold",
        steps: [
          "下載家樂福 App 並開通「家樂福錢包」",
          "使用「玉山家樂福聯名卡」於每週一儲值、或每週三在 App 內儲值滿額，享儲值點數加碼",
          "結帳時使用錢包餘額扣款消費，賺取高額紅利點數"
        ],
        tip: "紅利點數 300 點可折抵 1 元，相當於 1% 基本回饋，搭配活動儲值最划算。"
      },
      {
        name: "全支付 綁定指定信用卡",
        reward: "2.5% - 4.0%",
        badge: "行動支付推薦",
        badgeType: "silver",
        steps: [
          "於家樂福結帳時出示「全支付」條碼",
          "綁定「合作金庫卡」或「玉山信用卡」可享有加碼回饋"
        ],
        tip: "全支付綁定銀行卡回饋名額通常有限，建議消費前查看全支付 App 的剩餘額度提示。"
      },
      {
        name: "街口支付 / LINE Pay + 綁定高回饋卡",
        reward: "2.0% - 3.8%",
        badge: "多元支付",
        badgeType: "normal",
        steps: [
          "使用街口支付、LINE Pay 綁定「台新 @GoGo卡」或「匯豐匯鑽卡」付款",
          "享有網購/支付加碼點數回饋"
        ],
        tip: "家樂福實體店面支援幾乎全台灣所有的行動支付，靈活性極佳。"
      }
    ]
  },
  {
    id: "rtmart",
    names: ["大潤發", "rt-mart", "rtmart", "大潤發量販"],
    displayName: "大潤發",
    category: "🛒 超市量販",
    methods: [
      {
        name: "台新大潤發聯名卡",
        reward: "1.3% - 3.0%",
        badge: "獨家回饋",
        badgeType: "gold",
        steps: [
          "在店內直接刷「台新大潤發聯名卡」消費",
          "大潤發店內消費享 1% 現金回饋 + 大潤發紅利點數 2 倍（約 0.3%），合計 1.3%",
          "特定促銷檔期或滿額活動可享有最高 3% 或以上的現金券回饋"
        ],
        tip: "紅利點數可於結帳時折抵，折抵無上限。"
      },
      {
        name: "全支付 / 街口支付 綁定指定信用卡",
        reward: "2.0% - 3.8%",
        badge: "行動支付推薦",
        badgeType: "silver",
        steps: [
          "綁定「台新 @GoGo卡」或「富邦指定卡」至全支付或街口支付 App",
          "大潤發結帳時出示條碼付款，獲取信用卡本身的加碼回饋"
        ],
        tip: "全支付綁定信用卡亦常有滿額贈點活動，可雙重疊加。"
      }
    ]
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

// 搜尋核心邏輯
function handleSearch(query) {
  const cleanQuery = query.trim().toLowerCase();
  
  if (!cleanQuery) {
    resetToPlaceholder();
    return;
  }

  // 尋找匹配的商店 (關鍵字模糊搜尋)
  const matches = storeDatabase.filter(store => {
    return store.names.some(keyword => keyword.includes(cleanQuery) || cleanQuery.includes(keyword));
  });

  if (matches.length === 0) {
    renderNoResults(query);
  } else {
    renderResults(matches);
  }
}

// 渲染無結果狀態
function renderNoResults(query) {
  // 列出目前支援的所有商店，引導使用者搜尋
  const supportedList = storeDatabase.map(s => s.displayName).join('、');
  
  resultContainer.innerHTML = `
    <div class="no-result-card" style="animation: slideUp 0.4s ease-out;">
      <span class="no-result-icon">🧐</span>
      <h3 class="no-result-title">目前尚未收錄「${escapeHtml(query)}」</h3>
      <p class="no-result-text">您可以試著搜尋：全聯、中油、7-11、全家、家樂福或大潤發。</p>
      <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-muted); max-width: 90%;">
        <strong>目前已支援通路：</strong><br>${supportedList}
      </div>
    </div>
  `;
}

// 渲染匹配結果
function renderResults(stores) {
  resultContainer.innerHTML = "";

  stores.forEach((store) => {
    // 建立商店標題
    const storeHeader = document.createElement("div");
    storeHeader.className = "store-result-header";
    storeHeader.innerHTML = `
      <h2 class="store-name"><span>${store.displayName}</span></h2>
      <span class="store-category">${store.category}</span>
    `;
    resultContainer.appendChild(storeHeader);

    // 建立推薦卡片
    store.methods.forEach((method, index) => {
      const card = document.createElement("div");
      
      // 回饋數值轉換與高回饋標記 (大於等於 3.8% 標為 high-reward)
      const numericPct = parseFloat(method.reward);
      const isHighReward = !isNaN(numericPct) && numericPct >= 3.8;
      
      card.className = `payment-card rank-${index} ${isHighReward ? 'high-reward' : ''}`;
      
      // 依金銀銅等級給予不同的小徽章樣式
      let badgeClass = "normal";
      if (index === 0) badgeClass = "gold";
      else if (index === 1) badgeClass = "silver";

      // 步驟生成
      const stepsHtml = method.steps.map((step, i) => `
        <div class="step-item">
          <span class="step-num">${i + 1}.</span>
          <span>${escapeHtml(step)}</span>
        </div>
      `).join("");

      card.innerHTML = `
        <div class="card-header">
          <div class="card-title-group">
            <span class="card-badge ${badgeClass}">${method.badge}</span>
            <h3 class="card-title">${escapeHtml(method.name)}</h3>
          </div>
          <div class="reward-badge">
            <span class="reward-pct">${method.reward}</span>
            <span class="reward-unit">${method.rewardSuffix || '%'}</span>
          </div>
        </div>
        
        <div class="formula-steps">
          ${stepsHtml}
        </div>
        
        <div class="card-tips">
          <span class="tip-icon">💡</span>
          <span>${escapeHtml(method.tip)}</span>
        </div>
      `;
      
      // 設定動畫延遲，產生動態瀑布流效果
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
