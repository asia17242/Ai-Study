// ==========================================================================
// Web-First Voice Finance Application Logic
// ==========================================================================

// Global state variables
let transactions = [];
let isRecording = false;
let recognition = null;
let activePeriod = 'month';
let currentModalTxId = null;
const MONTHLY_BUDGET = 10000;
let pendingRecurringTx = null;
let html5QrcodeScanner = null;
let carrierBarcode = '';
let carrierPin = '';
let bankAccounts = [];
let loans = [];
let isPrivacyMode = false;

// ==========================================================================
// Anime Assistant Quote Engine
// ==========================================================================
const animeAssistantQuotes = {
  onExpenseSubmitted: [
    "嗶嗶——偵測到荷包進入加護病房！主人請立刻對錢包進行心肺復甦術！😭",
    "哼，剛才那筆消費，本助理嚴重懷疑你只是在滿足自己的物慾！(盯—) 🧊",
    "這哪是記帳，這是把下半輩子的積蓄一口氣超渡了吧？(抖)"
  ],
  onIncomeSubmitted: [
    "哇！這次竟然記了一筆收入！看在你這麼努力存錢的份上，今晚允許你多看一集漫畫！✨",
    "（拍手）主人太棒了！有收入進帳的感覺真好，離養活本助理又近了一步呢！✨"
  ],
  onPeriodToggled: [
    "（嚼嚼）...啊！主人你切換到統計圖表了？這花得太狂了吧，錢包在哭泣哦！😱",
    "點擊統計幹嘛？難道是在期待錢包裡會自己生出利息嗎？笨蛋主人～🍵",
    "只是進來看看沒花錢？很好，保持雙手插口袋的姿勢，不准拿錢包！"
  ],
  onIdle: [
    "主人～別只顧著看螢幕嘛，快來記一筆帳本助理瞧瞧你今天的戰績！😼",
    "Zzz... （流口水）...啊！沒有在睡！本助理只是在閉目養神思考理財策略！",
    "那個...主人，你確定不把剛剛買的那杯奶茶記上去嗎？我等你喔～☕"
  ],
  onInvoiceScanned: [
    "主人！發票已經自動匯入囉！✨",
    "嗶！發票掃描成功～這筆消費已被本助理精準攔截，絕不讓任何花費逃出記帳本！📋",
    "掃到了掃到了！主人你的發票我已經幫你記下來了，不用謝啦～(得意地轉圈) 💫",
    "發票已入帳！主人，今天消費的勇氣值得嘉獎，但記得月底要還信用卡唷！😆"
  ],
  onSubCategoryDetected: [
    "主人，剛才那筆『午餐』幫你記在『餐飲』的子項目囉！這樣月底看報表會更清楚呢！✨",
    "嘿嘿～本助理已經精準把這筆消費歸類到子項了，主人的財務報表保證整整齊齊！📊",
    "子分類已鎖定！主人以後可以輕鬆看到每個細項花了多少錢喔！🎯"
  ],
  onManualEntry: [
    "收到！已經幫主人把手動輸入的這一筆確實記在帳本上囉！筆跡非常完美！📝",
    "手動記帳確認完畢！主人親手寫下的每一筆，本助理都會好好珍藏～💾",
    "登登！手動賬目已入庫，主人的理財紀律感又提升了 1 級呢！⭐"
  ],
  onLoanRepayment: [
    "哇！主人今天又一筆還款成功囉！看到負債進度條持續縮短，本助理真的太佩服你的毅力了！我們離無債一身輕又更近一步了！🎉",
    "貸款還款已記錄！主人你是本助理見過最自律的理財達人，債務進度條又往前衝了一截！💪",
    "鏘鏘！又一筆還款入帳～負債正以肉眼可見的速度消失中，太感動了！😭✨"
  ]
};

let typewriterTimer = null;

function triggerAnimeQuote(eventType) {
  const quotes = animeAssistantQuotes[eventType];
  if (!quotes || quotes.length === 0) return;
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const textEl = document.getElementById('manga-bubble-text');
  const cursorEl = document.getElementById('typewriter-cursor');
  const bubble = document.getElementById('manga-bubble');
  
  if (typewriterTimer) clearTimeout(typewriterTimer);
  bubble.classList.add('visible');
  cursorEl.classList.remove('paused');
  
  let i = -1;
  const chars = [...randomQuote];
  function typeNext() {
    if (typewriterTimer) clearTimeout(typewriterTimer);
    i++;
    if (i < chars.length) {
      textEl.textContent = chars.slice(0, i + 1).join('');
      typewriterTimer = setTimeout(typeNext, 40 + Math.random() * 25);
    } else {
      cursorEl.classList.add('paused');
      typewriterTimer = setTimeout(() => {
        bubble.classList.remove('visible');
        textEl.textContent = '';
      }, 6000);
    }
  }
  typeNext();
}

function triggerAnimeCustomQuote(customText) {
  const textEl = document.getElementById('manga-bubble-text');
  const cursorEl = document.getElementById('typewriter-cursor');
  const bubble = document.getElementById('manga-bubble');
  
  if (typewriterTimer) clearTimeout(typewriterTimer);
  bubble.classList.add('visible');
  cursorEl.classList.remove('paused');
  
  let i = -1;
  const chars = [...customText];
  function typeNext() {
    if (typewriterTimer) clearTimeout(typewriterTimer);
    i++;
    if (i < chars.length) {
      textEl.textContent = chars.slice(0, i + 1).join('');
      typewriterTimer = setTimeout(typeNext, 40 + Math.random() * 25);
    } else {
      cursorEl.classList.add('paused');
      typewriterTimer = setTimeout(() => {
        bubble.classList.remove('visible');
        textEl.textContent = '';
      }, 7000);
    }
  }
  typeNext();
}

// Category colors mapping (corresponds to CSS colors)
const categoryColors = {
  '餐飲': '#ff9f43',
  '餐飲食品': '#ff9f43',
  '交通': '#54a0ff',
  '交通出行': '#54a0ff',
  '購物': '#1dd1a1',
  '日常用品': '#1dd1a1',
  '娛樂': '#9b5de5',
  '娛樂消費': '#9b5de5',
  '醫療': '#ee5253',
  '醫療保健': '#ee5253',
  '教育': '#341f97',
  '居家': '#00d2d3',
  '薪資': '#10ac84',
  '獎金': '#feca57',
  '投資': '#54a0ff',
  '其他': '#8395a7'
};

// Category icons mapping
const categoryIcons = {
  '餐飲': 'fastfood',
  '餐飲食品': 'fastfood',
  '交通': 'directions_subway',
  '交通出行': 'directions_subway',
  '購物': 'shopping_bag',
  '日常用品': 'shopping_bag',
  '娛樂': 'sports_esports',
  '娛樂消費': 'sports_esports',
  '醫療': 'local_hospital',
  '醫療保健': 'local_hospital',
  '教育': 'school',
  '居家': 'home',
  '薪資': 'monetization_on',
  '獎金': 'card_membership',
  '投資': 'trending_up',
  '其他': 'category'
};

// L2 Sub-category mapping (core defaults)
const CORE_SUB_CATEGORIES = {
  '餐飲食品': ['早餐', '午餐', '晚餐', '飲料/零食', '宵夜'],
  '交通出行': ['加油', '停車', '大眾運輸', '計程車'],
  '日常用品': [],
  '娛樂消費': [],
  '醫療保健': [],
  '教育': [],
  '居家': [],
  '薪資': [],
  '獎金': [],
  '投資': [],
  '其他': []
};

const CORE_PAYMENT_METHODS = ['現金', '信用卡', '行動支付', '銀行轉帳'];
const CORE_PRIMARY_CATEGORIES = ['餐飲食品', '交通出行', '日常用品', '娛樂消費', '醫療保健', '教育', '居家', '薪資', '獎金', '投資'];

function loadDynamicOptions() {
  const stored = localStorage.getItem('voice_finance_dynamic_options');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  const defaults = {
    accounts: [...CORE_PAYMENT_METHODS, '其他'],
    categories: [...CORE_PRIMARY_CATEGORIES, '其他'],
    subCategories: {}
  };
  Object.keys(CORE_SUB_CATEGORIES).forEach(cat => {
    defaults.subCategories[cat] = [...CORE_SUB_CATEGORIES[cat], '其他'];
  });
  return defaults;
}

function saveDynamicOptions(opts) {
  localStorage.setItem('voice_finance_dynamic_options', JSON.stringify(opts));
}

let dynamicOptions = loadDynamicOptions();

function getDynamicOptions(type, parent) {
  if (type === 'accounts') return dynamicOptions.accounts;
  if (type === 'categories') return dynamicOptions.categories;
  if (type === 'sub') {
    if (!dynamicOptions.subCategories[parent]) dynamicOptions.subCategories[parent] = ['其他'];
    return dynamicOptions.subCategories[parent];
  }
  return [];
}

function addCustomOption(type, parent, value) {
  const list = (type === 'sub')
    ? dynamicOptions.subCategories[parent] || (dynamicOptions.subCategories[parent] = ['其他'])
    : dynamicOptions[type];
  if (!list.includes(value)) {
    if (list[list.length - 1] === '其他') {
      list.splice(list.length - 1, 0, value);
    } else {
      list.push(value);
    }
    saveDynamicOptions(dynamicOptions);
  }
  return list;
}

function removeCustomOption(type, parent, value) {
  if (value === '其他') return false;
  const coreList = type === 'sub' ? CORE_SUB_CATEGORIES[parent] || []
    : type === 'accounts' ? CORE_PAYMENT_METHODS
    : CORE_PRIMARY_CATEGORIES;
  if (coreList.includes(value)) return false;
  const list = (type === 'sub')
    ? dynamicOptions.subCategories[parent]
    : dynamicOptions[type];
  if (!list) return false;
  const idx = list.indexOf(value);
  if (idx >= 0) {
    list.splice(idx, 1);
    saveDynamicOptions(dynamicOptions);
    return true;
  }
  return false;
}

// Dynamic select rendering with inline add-new + delete panel
const ADD_NEW_VALUE = '__add_new__';
const _pendingDynamicCallbacks = {};

function renderSelectWithAdd(containerOrId, type, parent, selectedValue, onChangeHandler) {
  const selectEl = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
  if (!selectEl) return;
  const options = getDynamicOptions(type, parent);
  let html = '';
  options.forEach(opt => {
    const sel = opt === selectedValue ? ' selected' : '';
    html += `<option value="${escapeHtml(opt)}"${sel}>${escapeHtml(opt)}</option>`;
  });
  html += `<option value="${ADD_NEW_VALUE}" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>`;
  selectEl.innerHTML = html;
  selectEl.dataset.dynType = type;
  selectEl.dataset.dynParent = parent || '';

  const key = type + (parent ? ':' + parent : '');
  if (_pendingDynamicCallbacks[key]) {
    selectEl.removeEventListener('change', _pendingDynamicCallbacks[key]);
  }
  const handler = function() {
    if (this.value === ADD_NEW_VALUE) {
      showInlineAddPrompt(this, type, parent, onChangeHandler);
    } else {
      onChangeHandler(this.value);
    }
  };
  selectEl.addEventListener('change', handler);
  _pendingDynamicCallbacks[key] = handler;
}

function showInlineAddPrompt(selectEl, type, parent, onChangeHandler) {
  const existingPanel = selectEl.parentElement.querySelector('.inline-add-panel');
  if (existingPanel) existingPanel.remove();

  const panel = document.createElement('div');
  panel.className = 'inline-add-panel';
  panel.innerHTML = `
    <input type="text" class="inline-add-input" placeholder="請輸入新項目名稱" maxlength="12">
    <button class="inline-add-confirm btn btn-success" style="padding:4px 10px;font-size:11px;">新增</button>
    <button class="inline-add-cancel btn btn-outline" style="padding:4px 10px;font-size:11px;">取消</button>
  `;
  selectEl.parentElement.appendChild(panel);

  const input = panel.querySelector('.inline-add-input');
  input.focus();
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') panel.querySelector('.inline-add-confirm').click();
  });
  panel.querySelector('.inline-add-confirm').addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) return;
    if (getDynamicOptions(type, parent).includes(val)) {
      triggerAnimeCustomQuote('主人～這個名稱已經存在了，換一個試試看吧！😅');
      return;
    }
    addCustomOption(type, parent, val);
    renderSelectWithAdd(selectEl, type, parent, val, onChangeHandler);
    panel.remove();
    selectEl.value = val;
    onChangeHandler(val);
    triggerAnimeCustomQuote('主人！新的自訂標籤已經裝進選單了！隨時可以使用它來精確記帳囉！🏷️');
  });
  panel.querySelector('.inline-add-cancel').addEventListener('click', () => {
    panel.remove();
    const options = getDynamicOptions(type, parent);
    selectEl.value = options[options.length - 2] || options[0];  // select last real option
  });
}

function renderDeletePanel(type, parent) {
  const key = type + (parent ? ':' + parent : '');
  const existingPanel = document.getElementById('delete-panel-' + key);
  if (existingPanel) { existingPanel.remove(); return; }

  document.querySelectorAll('.custom-delete-panel').forEach(p => p.remove());

  const options = getDynamicOptions(type, parent);
  const coreList = type === 'sub' ? [...(CORE_SUB_CATEGORIES[parent] || []), '其他']
    : type === 'accounts' ? [...CORE_PAYMENT_METHODS, '其他']
    : [...CORE_PRIMARY_CATEGORIES, '其他'];
  const deletable = options.filter(o => !coreList.includes(o));
  if (deletable.length === 0) {
    triggerAnimeCustomQuote('目前還沒有自訂項目可以刪除喔～先新增一些再來整理吧！📋');
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'delete-panel-' + key;
  panel.className = 'custom-delete-panel';
  let itemsHTML = deletable.map(item =>
    `<div class="delete-panel-item">
      <span>${escapeHtml(item)}</span>
      <button class="delete-panel-x" onclick="event.stopPropagation(); removeCustomOption('${type}','${parent||''}','${escapeHtml(item).replace(/'/g,"\\'")}'); document.getElementById('delete-panel-${key}').remove(); triggerRefreshAllSelects()">✕</button>
    </div>`
  ).join('');
  panel.innerHTML = itemsHTML;
  return panel;
}

window.triggerRefreshAllSelects = function() {
  saveDynamicOptions(dynamicOptions);
  updateDashboard();
  triggerAnimeCustomQuote('已移除自訂標籤！選單已經更新完畢～✨');
};

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==========================================================================
// Privacy Masking Module
// ==========================================================================
function togglePrivacyMode() {
  isPrivacyMode = !isPrivacyMode;
  const icon = document.getElementById('privacy-toggle-icon');
  if (icon) {
    icon.textContent = isPrivacyMode ? 'visibility_off' : 'visibility';
  }
  updateDashboard();
  renderAccountsPanel();
  renderLoansPanel();
}

function applyPrivacyMask() {
  const selectors = [
    '#total-balance', '#total-income', '#total-expense',
    '#chart-total-value', '.amt-text', '.legend-value',
    '.balance-value', '#budget-percent'
  ];
  selectors.forEach(function(sel) {
    document.querySelectorAll(sel).forEach(function(el) {
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent;
      }
      el.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
      el.classList.add('privacy-masked');
    });
  });

  document.querySelectorAll('.loan-details span').forEach(function(el) {
    if (!el.dataset.originalText) {
      el.dataset.originalText = el.textContent;
    }
    el.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
    el.classList.add('privacy-masked');
  });

  document.querySelectorAll('.loan-bar-label').forEach(function(el) {
    if (!el.dataset.originalText) {
      el.dataset.originalText = el.textContent;
    }
    el.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
    el.classList.add('privacy-masked');
  });

  document.querySelectorAll('.bar-chart-value-text').forEach(function(el) {
    if (!el.dataset.originalText_privacy) {
      el.dataset.originalText_privacy = el.textContent;
    }
    el.textContent = '\u2022\u2022\u2022';
    el.setAttribute('data-privacy-masked', '1');
  });
}

function removePrivacyMask() {
  document.querySelectorAll('.privacy-masked').forEach(function(el) {
    if (el.dataset.originalText) {
      el.textContent = el.dataset.originalText;
      delete el.dataset.originalText;
    }
    el.classList.remove('privacy-masked');
  });
  document.querySelectorAll('[data-privacy-masked="1"]').forEach(function(el) {
    if (el.dataset.originalText_privacy) {
      el.textContent = el.dataset.originalText_privacy;
      delete el.dataset.originalText_privacy;
    }
    el.removeAttribute('data-privacy-masked');
  });
}

// ==========================================================================
// Inline Ledger Row Editing
// ==========================================================================
function startInlineDescEdit(spanEl, txId) {
  if (spanEl.querySelector('input')) return;
  var originalText = spanEl.dataset.originalText || spanEl.textContent;
  var input = document.createElement('input');
  input.type = 'text';
  input.value = originalText;
  input.className = 'inline-edit-input';
  input.style.cssText = 'background:rgba(0,0,0,0.35);border:1px solid var(--accent-cyan);color:white;padding:3px 8px;border-radius:6px;font-size:13px;font-family:inherit;width:100%;min-width:80px;outline:none;';
  spanEl.replaceWith(input);
  input.focus();
  input.select();

  input.addEventListener('blur', function() {
    finishInlineDescEdit(input, txId, originalText);
  });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { input.blur(); }
    if (e.key === 'Escape') {
      input.value = originalText;
      input.blur();
    }
  });
}

function finishInlineDescEdit(input, txId, originalValue) {
  var newValue = input.value.trim();
  var span = document.createElement('span');
  span.className = 'desc-text';
  span.textContent = newValue || originalValue;
  span.setAttribute('ondblclick', 'startInlineDescEdit(this, \'' + txId + '\')');
  if (isPrivacyMode) {
    span.dataset.originalText = newValue || originalValue;
    span.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
    span.classList.add('privacy-masked');
  }
  input.replaceWith(span);

  if (newValue && newValue !== originalValue) {
    var tx = transactions.find(function(t) { return t.id === txId; });
    if (tx) {
      tx.description = newValue;
      saveTransactionsToStorage();
      patchTransaction(txId, { description: newValue });
    }
  }
}

function startInlineAmtEdit(spanEl, txId) {
  if (spanEl.querySelector('input')) return;
  var originalText = spanEl.dataset.originalText || spanEl.textContent;
  var tx = transactions.find(function(t) { return t.id === txId; });
  if (!tx) return;
  var numericVal = tx.amount.toString();

  var input = document.createElement('input');
  input.type = 'text';
  input.value = numericVal;
  input.className = 'inline-edit-input';
  input.style.cssText = 'background:rgba(0,0,0,0.35);border:1px solid var(--accent-cyan);color:white;padding:3px 8px;border-radius:6px;font-size:14px;font-family:var(--font-family-heading);font-weight:700;width:100%;min-width:80px;outline:none;text-align:left;';
  spanEl.replaceWith(input);
  input.focus();
  input.select();

  input.addEventListener('blur', function() {
    finishInlineAmtEdit(input, txId, originalText, tx);
  });
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { input.blur(); }
    if (e.key === 'Escape') {
      input.value = tx.amount.toString();
      input.blur();
    }
  });
}

function finishInlineAmtEdit(input, txId, originalText, tx) {
  var rawVal = input.value.replace(/,/g, '');
  var amountVal = parseFloat(rawVal);
  var isExpense = tx.type === 'expense';

  if (isNaN(amountVal) || amountVal <= 0) {
    triggerAnimeCustomQuote('\u4E3B\u4EBA\uFF5E\u91D1\u984D\u53EA\u80FD\u8F38\u5165\u6578\u5B57\u5594\uFF01\u8ACB\u91CD\u65B0\u8F38\u5165\uFF5E\uD83E\uDDD0');
    var span = document.createElement('span');
    span.className = 'amt-text ' + (isExpense ? 'expense-color' : 'income-color');
    span.textContent = (isExpense ? '-' : '+') + '$' + tx.amount.toLocaleString();
    span.setAttribute('ondblclick', 'startInlineAmtEdit(this, \'' + txId + '\')');
    if (isPrivacyMode) {
      span.dataset.originalText = span.textContent;
      span.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
      span.classList.add('privacy-masked');
    }
    input.replaceWith(span);
    return;
  }

  tx.amount = amountVal;
  saveTransactionsToStorage();
  patchTransaction(txId, { amount: amountVal });
  updateDashboard();
}

// ==========================================================================
// JSON Backup & Restore Engine
// ==========================================================================
function exportJSONBackup() {
  var backup = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    data: {
      transactions: transactions,
      bank_accounts: bankAccounts,
      loans: loans,
      dynamic_options: dynamicOptions,
      carrier: { barcode: carrierBarcode, pin: carrierPin }
    }
  };
  var json = JSON.stringify(backup, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'voice_finance_backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  triggerAnimeCustomQuote('\u5E33\u672C\u5099\u4EFD\u5DF2\u4E0B\u8F09\uFF01\u4E3B\u4EBA\u53EF\u4EE5\u628A\u9019\u500B JSON \u6A94\u6848\u5B89\u5168\u4FDD\u5B58\u8D77\u4F86\u5594\uFF5E\uD83D\uDCBE');
}

function importJSONBackup() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(evt) {
      try {
        var backup = JSON.parse(evt.target.result);
        if (!backup.data) throw new Error('Invalid format');
        var d = backup.data;
        if (d.transactions) localStorage.setItem('voice_finance_transactions', JSON.stringify(d.transactions));
        if (d.bank_accounts) localStorage.setItem('voice_finance_bank_accounts', JSON.stringify(d.bank_accounts));
        if (d.loans) localStorage.setItem('voice_finance_loans', JSON.stringify(d.loans));
        if (d.dynamic_options) localStorage.setItem('voice_finance_dynamic_options', JSON.stringify(d.dynamic_options));
        if (d.carrier) localStorage.setItem('voice_finance_carrier', JSON.stringify(d.carrier));
        triggerAnimeCustomQuote('\u5E33\u672C\u9084\u539F\u6210\u529F\uFF01\u9801\u9762\u5C07\u91CD\u65B0\u8F09\u5165\uFF5E\uD83D\uDD04');
        setTimeout(function() { window.location.reload(); }, 1500);
      } catch (err) {
        triggerAnimeCustomQuote('\u4E3B\u4EBA\uFF5E\u9019\u500B\u6A94\u6848\u683C\u5F0F\u597D\u50CF\u4E0D\u5C0D\u5594\uFF01\u8ACB\u9078\u64C7\u6B63\u78BA\u7684\u5099\u4EFD\u6A94\u6848\uFF5E\uD83D\uDE05');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Backward-compatible reference wrappers
function getSubCategories(cat) {
  return getDynamicOptions('sub', cat);
}

function getPaymentMethods() {
  return getDynamicOptions('accounts');
}

function getPrimaryCategories() {
  return getDynamicOptions('categories');
}

// ==========================================================================
// Initialize App
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadTransactionsFromStorage();
  loadAccountsFromStorage();
  loadLoansFromStorage();
  initSpeechRecognition();
  bindUIEvents();
  updateDashboard();
  renderAccountsPanel();
  renderLoansPanel();
  checkAutoRepayments();
});

// Load transactions from localStorage
function loadTransactionsFromStorage() {
  const stored = localStorage.getItem('voice_finance_transactions');
  if (stored) {
    try {
      transactions = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse transactions", e);
      transactions = [];
    }
  } else {
    // Insert multi-month demo transactions for period-filter testing
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateOf = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;
    const monthAgo = (offset) => {
      const dt = new Date(y, m - 1 - offset, Math.min(d, 28));
      return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
    };
    
    transactions = [
      { id: 'demo0', date: dateOf(y, m, d), type: 'expense', amount: 120, category: '餐飲食品', description: '排骨便當', payment_method: '現金', merchant: '便當店', transcript: '今天中午吃排骨便當花了120元', items: ['排骨便當'] },
      { id: 'demo0b', date: dateOf(y, m, d-1), type: 'expense', amount: 800, category: '交通出行', description: '中油加滿油', payment_method: '中油Pay / 國泰世華', merchant: '中油', transcript: '用中油Pay加滿油花了800塊', items: ['無鉛汽油'] },
      { id: 'demo0c', date: dateOf(y, m, d-2), type: 'income', amount: 3000, category: '薪資', description: '兼職收入', payment_method: '現金', merchant: '客戶', transcript: '收到兼職薪水3000元', items: [] },
      { id: 'demo0d', date: dateOf(y, m, d-3), type: 'expense', amount: 250, category: '日常用品', description: '全聯採買', payment_method: '全支付 / 玉山銀行', merchant: '全聯', transcript: '去全聯買鮮奶和麵包花了250元', items: ['鮮奶', '麵包'] },
      { id: 'demo0e', date: dateOf(y, m, d-5), type: 'expense', amount: 1500, category: '娛樂消費', description: '電影票+爆米花', payment_method: '信用卡', merchant: '威秀影城', transcript: '看電影買爆米花花了1500元', items: ['電影票', '爆米花'] },
      // Previous month
      { id: 'demo1a', date: monthAgo(1), type: 'expense', amount: 3500, category: '居家', description: '房租', payment_method: '轉帳', merchant: '房東', transcript: '繳這個月房租3500元', items: [] },
      { id: 'demo1b', date: monthAgo(1), type: 'expense', amount: 600, category: '餐飲食品', description: '同事聚餐', payment_method: 'LINE Pay', merchant: '火鍋店', transcript: '跟同事吃火鍋花了600元', items: ['火鍋'] },
      { id: 'demo1c', date: monthAgo(1), type: 'income', amount: 15000, category: '薪資', description: '正職薪水', payment_method: '銀行轉帳', merchant: '公司', transcript: '收到正職薪水15000元', items: [] },
      // 2 months ago
      { id: 'demo2a', date: monthAgo(2), type: 'expense', amount: 2200, category: '交通出行', description: '高鐵車票', payment_method: '信用卡', merchant: '高鐵', transcript: '買高鐵來回票花了2200元', items: ['來回票'] },
      { id: 'demo2b', date: monthAgo(2), type: 'expense', amount: 900, category: '醫療保健', description: '看牙醫', payment_method: '現金', merchant: '牙醫診所', transcript: '看牙醫花了900元', items: [] },
      { id: 'demo2c', date: monthAgo(2), type: 'income', amount: 18000, category: '薪資', description: '正職薪水', payment_method: '銀行轉帳', merchant: '公司', transcript: '收到正職薪水18000元', items: [] },
      // 3 months ago
      { id: 'demo3a', date: monthAgo(3), type: 'expense', amount: 4200, category: '教育', description: '線上課程', payment_method: '信用卡', merchant: '線上平台', transcript: '買線上程式課程花了4200元', items: ['課程'] },
      { id: 'demo3b', date: monthAgo(3), type: 'income', amount: 5000, category: '獎金', description: '專案獎金', payment_method: '銀行轉帳', merchant: '公司', transcript: '收到專案獎金5000元', items: [] },
      // 5 months ago
      { id: 'demo5a', date: monthAgo(5), type: 'expense', amount: 6800, category: '居家', description: '買家具', payment_method: '信用卡', merchant: 'IKEA', transcript: '買新書桌和椅子花了6800元', items: ['書桌', '椅子'] },
      { id: 'demo5b', date: monthAgo(5), type: 'income', amount: 22000, category: '薪資', description: '正職薪水+紅利', payment_method: '銀行轉帳', merchant: '公司', transcript: '收到薪水加紅利共22000元', items: [] },
      // 8 months ago
      { id: 'demo8a', date: monthAgo(8), type: 'expense', amount: 12000, category: '其他', description: '年繳保費', payment_method: '信用卡', merchant: '保險公司', transcript: '年繳保險費12000元', items: [] },
      { id: 'demo8b', date: monthAgo(8), type: 'expense', amount: 5000, category: '交通出行', description: '機車維修', payment_method: '現金', merchant: '機車行', transcript: '機車大保養花了5000元', items: ['機油', '輪胎'] },
      // 10 months ago
      { id: 'demo10a', date: monthAgo(10), type: 'expense', amount: 2500, category: '娛樂消費', description: '演唱會門票', payment_method: '信用卡', merchant: '售票平台', transcript: '買演唱會門票花了2500元', items: ['門票'] },
    ];
    saveTransactionsToStorage();
  }
}

function saveTransactionsToStorage() {
  localStorage.setItem('voice_finance_transactions', JSON.stringify(transactions));
}

function getFilteredTransactions() {
  const now = new Date();
  const today = getFormattedDate(0);
  
  if (activePeriod === 'day') {
    return transactions.filter(t => t.date === today);
  } else if (activePeriod === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    return transactions.filter(t => t.date >= weekAgoStr && t.date <= today);
  } else if (activePeriod === 'year') {
    const currentYear = now.getFullYear();
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === currentYear;
    });
  } else {
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }
}

// ==========================================================================
// Web Speech API Integration
// ==========================================================================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    document.getElementById('mic-status').innerText = '您的瀏覽器不支援 Web Speech 語音識別。您可以點擊下方氣泡或手動輸入文字進行測試。';
    document.getElementById('mic-btn').disabled = true;
    document.getElementById('mic-btn').style.opacity = '0.5';
    return;
  }
  
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'zh-TW';
  recognition.interimResults = true;
  
  recognition.onstart = () => {
    isRecording = true;
    updateMicButtonState();
    document.getElementById('mic-status').innerText = '正在錄音中...請大聲說話';
    document.getElementById('transcript-text').innerText = '聽取中...';
    document.getElementById('transcript-text').classList.remove('transcript-placeholder');
  };
  
  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    const displayResult = finalTranscript || interimTranscript;
    if (displayResult) {
      document.getElementById('transcript-text').innerText = displayResult;
    }
  };
  
  recognition.onerror = (event) => {
    console.error('Speech recognition error', event);
    isRecording = false;
    updateMicButtonState();
    document.getElementById('mic-status').innerText = `辨識出錯: ${event.error}`;
  };
  
  recognition.onend = () => {
    if (isRecording) {
      isRecording = false;
      updateMicButtonState();
      document.getElementById('mic-status').innerText = '錄音結束';
      
      const recognizedText = document.getElementById('transcript-text').innerText;
      if (recognizedText && recognizedText !== '聽取中...' && recognizedText.trim().length > 0) {
        showTranscriptActions();
      } else {
        document.getElementById('mic-status').innerText = '未偵測到語音內容，請重試。';
      }
    }
  };
}

function updateMicButtonState() {
  const micBtn = document.getElementById('mic-btn');
  if (isRecording) {
    micBtn.classList.add('recording');
  } else {
    micBtn.classList.remove('recording');
  }
}

// ==========================================================================
// Event Binding
// ==========================================================================
function bindUIEvents() {
  // Mic Button Click
  const micBtn = document.getElementById('mic-btn');
  if (micBtn && recognition) {
    micBtn.addEventListener('click', () => {
      if (isRecording) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }
  
  // Manual Input Submit
  const parseBtn = document.getElementById('parse-text-btn');
  if (parseBtn) {
    parseBtn.addEventListener('click', () => {
      const textInput = document.getElementById('manual-text-input').value.trim();
      if (textInput) {
        parseVoiceTransaction(textInput);
        document.getElementById('manual-text-input').value = '';
      }
    });
  }
  
  // Keypress event for manual input
  document.getElementById('manual-text-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('parse-text-btn').click();
    }
  });
  
  // Transcript action buttons
  document.getElementById('btn-edit-transcript').addEventListener('click', () => toggleEditMode());
  document.getElementById('btn-confirm-write').addEventListener('click', () => commitTranscript());
  document.getElementById('btn-cancel-reset').addEventListener('click', () => resetTranscript());
  
  // Period switcher pills
  document.querySelectorAll('.period-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.period-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activePeriod = pill.dataset.period;
      updateDashboard();
      triggerAnimeQuote('onPeriodToggled');
    });
  });
  
  // Anime character click
  document.getElementById('anime-character').addEventListener('click', () => {
    triggerAnimeQuote('onIdle');
  });
  
  // Recurring setup form events
  document.getElementById('recurring-end-type').addEventListener('change', (e) => {
    document.getElementById('recurring-end-date-field').style.display = e.target.value === 'custom' ? '' : 'none';
  });
  document.getElementById('btn-confirm-recurring').addEventListener('click', confirmRecurringTransaction);
  document.getElementById('btn-cancel-recurring').addEventListener('click', cancelRecurringTransaction);
  
  // Modal events
  document.getElementById('modal-close-btn').addEventListener('click', closeTransactionModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeTransactionModal();
  });
  document.getElementById('modal-save-btn').addEventListener('click', saveModalChanges);
  document.getElementById('modal-delete-btn').addEventListener('click', deleteFromModal);

  // QR Scanner events
  document.getElementById('btn-scan-invoice').addEventListener('click', openQrScanner);
  document.getElementById('scanner-modal-close-btn').addEventListener('click', closeQrScanner);
  document.getElementById('scanner-modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeQrScanner();
  });

  // Carrier form events
  document.getElementById('btn-save-carrier').addEventListener('click', saveCarrierBinding);
  document.getElementById('btn-clear-carrier').addEventListener('click', clearCarrierBinding);

  // Manual Entry events
  document.getElementById('btn-manual-entry').addEventListener('click', openManualEntryModal);
  document.getElementById('manual-entry-close-btn').addEventListener('click', closeManualEntryModal);
  document.getElementById('manual-entry-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeManualEntryModal();
  });
  document.getElementById('btn-submit-manual').addEventListener('click', submitManualEntry);

  // Bank Account & Loan events
  document.getElementById('btn-add-account').addEventListener('click', addAccount);
  document.getElementById('btn-add-loan').addEventListener('click', addLoan);

  // Privacy toggle
  const privacyBtn = document.getElementById('privacy-toggle-btn');
  if (privacyBtn) {
    privacyBtn.addEventListener('click', togglePrivacyMode);
  }

  // CSV Export
  const csvBtn = document.getElementById('btn-export-csv');
  if (csvBtn) {
    csvBtn.addEventListener('click', exportCSV);
  }

  // JSON Backup
  const backupBtn = document.getElementById('btn-export-backup');
  if (backupBtn) {
    backupBtn.addEventListener('click', exportJSONBackup);
  }

  // JSON Restore
  const restoreBtn = document.getElementById('btn-import-backup');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', importJSONBackup);
  }

  // Load saved carrier
  loadCarrierFromStorage();
}

// Helper to fill hint texts
window.setInputText = function(text) {
  document.getElementById('manual-text-input').value = text;
  document.getElementById('manual-text-input').focus();
};

// ==========================================================================
// API Interaction & Parser
// ==========================================================================
async function parseVoiceTransaction(text) {
  const statusEl = document.getElementById('mic-status');
  statusEl.innerText = '⏳ 後端 AI 正在分析語意...';
  
  const today = getFormattedDate(0);
  
  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        current_date: today
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.is_recurring) {
        pendingRecurringTx = {
          id: Date.now().toString(),
          date: data.date || today,
          type: data.type || 'expense',
          amount: parseFloat(data.amount) || 0,
          category: data.category || '其他',
          sub_category: data.sub_category || '其他',
          description: data.description || text,
          payment_method: data.payment_method || '現金',
          merchant: data.merchant || '未知',
          transcript: text,
          items: data.items || [],
          isRecurring: true,
          dayOfPeriod: data.day_of_period,
          recurringFrequency: data.recurring_frequency || 'monthly'
        };
        showRecurringSetup(data.day_of_period, data.recurring_frequency, today);
        statusEl.innerHTML = '🔄 偵測到定期交易！請設定時間區間...';
        return;
      }
      
      // Add successful transaction to lists
      const newTx = {
        id: Date.now().toString(),
        date: data.date || today,
        type: data.type || 'expense',
        amount: parseFloat(data.amount) || 0,
        category: data.category || '其他',
        sub_category: data.sub_category || '其他',
        description: data.description || text,
        payment_method: data.payment_method || '現金',
        merchant: data.merchant || '未知',
        transcript: text,
        items: data.items || []
      };
      
      transactions.unshift(newTx);
      syncAccountBalance(newTx.payment_method, newTx.amount, newTx.type);
      saveTransactionsToStorage();
      updateDashboard();
      
      statusEl.innerHTML = `✅ 記帳成功！<b>$${newTx.amount}</b> (${newTx.category})`;
      
      triggerAnimeQuote(newTx.type === 'income' ? 'onIncomeSubmitted' : 'onExpenseSubmitted');
      
      // Clear manual input just in case
      document.getElementById('manual-text-input').value = '';
      
    } else {
      const err = await response.text();
      statusEl.innerText = `❌ API 解析失敗: ${err}`;
    }
  } catch (error) {
    console.error('API Error', error);
    statusEl.innerText = `❌ 連線後端伺服器失敗: ${error.message}`;
  }
}

// Delete transaction
window.deleteTransaction = function(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactionsToStorage();
  updateDashboard();
};

// ==========================================================================
// Transcript Action Buttons Handlers
// ==========================================================================
function showTranscriptActions() {
  document.getElementById('transcript-actions').style.display = 'flex';
}

function hideTranscriptActions() {
  document.getElementById('transcript-actions').style.display = 'none';
  const transcriptEl = document.getElementById('transcript-text');
  transcriptEl.contentEditable = 'false';
  const btnEdit = document.getElementById('btn-edit-transcript');
  btnEdit.innerHTML = '<span class="material-icons-round" style="font-size:14px;">edit</span> 手動修正';
}

function toggleEditMode() {
  const transcriptEl = document.getElementById('transcript-text');
  const btnEdit = document.getElementById('btn-edit-transcript');
  if (transcriptEl.contentEditable === 'true') {
    transcriptEl.contentEditable = 'false';
    btnEdit.innerHTML = '<span class="material-icons-round" style="font-size:14px;">edit</span> 手動修正';
  } else {
    transcriptEl.contentEditable = 'true';
    transcriptEl.focus();
    btnEdit.innerHTML = '<span class="material-icons-round" style="font-size:14px;">check</span> 完成編輯';
  }
}

function commitTranscript() {
  const text = document.getElementById('transcript-text').innerText.trim();
  if (text && text !== '聽取中...') {
    parseVoiceTransaction(text);
  }
  resetTranscript();
}

function resetTranscript() {
  const transcriptEl = document.getElementById('transcript-text');
  transcriptEl.innerText = '您說的話將在此即時顯示...';
  transcriptEl.classList.add('transcript-placeholder');
  transcriptEl.contentEditable = 'false';
  hideTranscriptActions();
  document.getElementById('mic-status').innerText = '點選按鈕開始錄音';
}

// ==========================================================================
// Recurring Transaction Setup
// ==========================================================================
function showRecurringSetup(dayOfPeriod, frequency, currentDate) {
  document.getElementById('recurring-setup').style.display = 'block';
  document.getElementById('transcript-actions').style.display = 'none';
  
  const startInput = document.getElementById('recurring-start-date');
  startInput.value = currentDate.substring(0, 7);
  
  const freqDisplay = document.getElementById('recurring-frequency-display');
  const day = dayOfPeriod || 1;
  if (frequency === 'weekly') {
    freqDisplay.value = '每週 ' + day;
  } else {
    freqDisplay.value = '每個月 ' + day + ' 日';
  }
  
  document.getElementById('recurring-end-type').value = 'forever';
  document.getElementById('recurring-end-date-field').style.display = 'none';
}

function hideRecurringSetup() {
  document.getElementById('recurring-setup').style.display = 'none';
  pendingRecurringTx = null;
}

function confirmRecurringTransaction() {
  if (!pendingRecurringTx) return;
  
  const startDate = document.getElementById('recurring-start-date').value + '-01';
  const endType = document.getElementById('recurring-end-type').value;
  let endDate = null;
  
  if (endType === 'custom') {
    endDate = document.getElementById('recurring-end-date').value + '-01';
  }
  
  const tx = {
    ...pendingRecurringTx,
    date: startDate,
    startDate: startDate,
    endDate: endDate,
    isRecurring: true
  };
  
  transactions.unshift(tx);
  saveTransactionsToStorage();
  updateDashboard();
  
  document.getElementById('mic-status').innerHTML = `✅ 定期交易已建立！<b>$${tx.amount}</b> (${tx.category}) 每月${pendingRecurringTx.dayOfPeriod || 1}日`;
  document.getElementById('manual-text-input').value = '';
  hideRecurringSetup();
}

function cancelRecurringTransaction() {
  document.getElementById('mic-status').innerText = '已取消定期交易設定';
  hideRecurringSetup();
}

// ==========================================================================
// UI Updates & Dynamic Statistics
// ==========================================================================
function updateDashboard() {
  // 0. Get period-filtered transactions
  const displayTx = getFilteredTransactions();
  
  // Update ledger section title based on period
  const titleEl = document.getElementById('ledger-section-title');
  const titles = { day: '本日記帳明細列表', week: '本週記帳明細列表', month: '本月記帳明細列表', year: '本年記帳明細列表' };
  if (titleEl) titleEl.innerText = titles[activePeriod] || '記帳明細列表';
  
  // 1. Calculate Sums
  let totalIncome = 0;
  let totalExpense = 0;
  
  displayTx.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  });
  
  const balance = totalIncome - totalExpense;
  
  // 2. Render summary values
  document.getElementById('total-balance').innerText = `$${balance.toLocaleString()}`;
  document.getElementById('total-income').innerText = `$${totalIncome.toLocaleString()}`;
  document.getElementById('total-expense').innerText = `$${totalExpense.toLocaleString()}`;
  
  const balanceStatus = document.getElementById('balance-status');
  if (balance >= 0) {
    balanceStatus.innerText = '狀態良好';
    balanceStatus.className = 'trend-text positive';
  } else {
    balanceStatus.innerText = '帳戶透支';
    balanceStatus.className = 'trend-text negative';
  }
  
  // 3. Populate transaction list table
  const tbody = document.getElementById('transaction-list-body');
  const noRecordsEl = document.getElementById('no-records-placeholder');
  tbody.innerHTML = '';
  
  if (displayTx.length === 0) {
    noRecordsEl.classList.add('active');
  } else {
    noRecordsEl.classList.remove('active');
    
    displayTx.forEach(t => {
      const tr = document.createElement('tr');
      
      const icon = categoryIcons[t.category] || 'category';
      const color = categoryColors[t.category] || '#8395a7';
      const dateDisplay = getRelativeDateLabel(t.date);
      const isExpense = t.type === 'expense';
      
      // Build options for category select menu
      const allCategories = getPrimaryCategories();
      ['其他'].forEach(c => { if (!allCategories.includes(c)) allCategories.push(c); });
      const currentCat = t.category || '其他';
      const displayCategories = allCategories.includes(currentCat) ? allCategories : [currentCat, ...allCategories];
      
      let categoryOptionsHTML = '';
      displayCategories.forEach(cat => {
        const selected = cat === currentCat ? 'selected' : '';
        categoryOptionsHTML += `<option value="${escapeHtml(cat)}" ${selected}>${escapeHtml(cat)}</option>`;
      });
      categoryOptionsHTML += `<option value="${ADD_NEW_VALUE}" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>`;

      const currentSub = t.sub_category || '其他';
      const l2Options = getSubCategories(currentCat);
      if (!l2Options.includes('其他')) l2Options.push('其他');
      let subCategoryPillsHTML = '';
      l2Options.forEach(l2 => {
        const active = l2 === currentSub ? ' active' : '';
        subCategoryPillsHTML += `<span class="sub-cat-pill${active}" onclick="event.stopPropagation(); updateTransactionSubCategory('${t.id}', '${l2}')">${l2}</span>`;
      });

      const allPayments = getPaymentMethods();
      if (!allPayments.includes('其他')) allPayments.push('其他');
      
      tr.innerHTML = `
        <td>
          <div class="cat-column">
            <div class="cat-icon-circle" style="background-color: ${color}20; color: ${color};">
              <span class="material-icons-round">${icon}</span>
            </div>
            <div class="cat-info">
              <select class="cat-select" onchange="handleLedgerCatChange(this, '${t.id}')">
                ${categoryOptionsHTML}
              </select>
              <div class="sub-cat-pills-row">
                ${subCategoryPillsHTML}
              </div>
              <div class="tx-date-wrapper">
                <span class="tx-date-label" onclick="triggerDatePicker('${t.id}')">${dateDisplay}</span>
                <input type="date" id="date-picker-${t.id}" class="tx-date-hidden-input" value="${t.date}" onchange="updateTransactionDate('${t.id}', this.value)">
              </div>
            </div>
          </div>
        </td>
        <td>
          <span class="desc-text" ondblclick="startInlineDescEdit(this, '${t.id}')">${t.description}</span>
          ${t.items && t.items.length > 0 ? `
            <div class="sub-items-row">
              ${t.items.map(item => `<span class="sub-item-tag">${escapeHtml(item)}</span>`).join('')}
            </div>
          ` : ''}
        </td>
        <td>
          <select class="pay-select" onchange="handleLedgerPayChange(this, '${t.id}')">
            ${allPayments.map(pm => {
              const currentPay = t.payment_method || '現金';
              const sel = pm === currentPay ? 'selected' : '';
              return `<option value="${escapeHtml(pm)}" ${sel}>${escapeHtml(pm)}</option>`;
            }).join('')}
            <option value="${ADD_NEW_VALUE}" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>
          </select>
        </td>
        <td>
          <span class="amt-text ${isExpense ? 'expense-color' : 'income-color'}" ondblclick="startInlineAmtEdit(this, '${t.id}')">
            ${isExpense ? '-' : '+'}$${t.amount.toLocaleString()}
          </span>
        </td>
        <td>
          <button class="detail-action-btn" onclick="event.stopPropagation(); window.openTransactionModal('${t.id}')">
            <span class="material-icons-round">open_in_new</span>
          </button>
          <button class="delete-action-btn" onclick="deleteTransaction('${t.id}')">
            <span class="material-icons-round">delete_outline</span>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
  }
  
  // 4. Update Chart (year → bar chart; week/month → pie chart)
  const displayExpenses = displayTx.filter(t => t.type === 'expense');
  const chartContent = document.querySelector('.chart-content');
  
  if (activePeriod === 'year') {
    renderBarChart(displayTx);
  } else {
    document.getElementById('pie-chart-visual').style.display = '';
    document.getElementById('bar-chart-visual').style.display = 'none';
    document.getElementById('chart-legend-container').style.display = '';
    if (chartContent) chartContent.classList.remove('has-bars');
    renderCategoryPieChart(totalExpense, displayExpenses);
  }
  
  // 5. Update Budget Progress Bar (period-sensitive)
  const periodBudget = activePeriod === 'day' ? Math.round(MONTHLY_BUDGET / 30) :
                       activePeriod === 'week' ? Math.round(MONTHLY_BUDGET / 4.33) :
                       activePeriod === 'year' ? MONTHLY_BUDGET * 12 :
                       MONTHLY_BUDGET;
  const spendRatio = totalExpense / periodBudget;
  const percent = Math.min(Math.round(spendRatio * 100), 100);
  document.getElementById('budget-percent').innerText = percent + '%';
  const fillEl = document.getElementById('budget-progress-fill');
  fillEl.style.width = percent + '%';
  if (spendRatio > 0.8) {
    fillEl.classList.add('warning');
  } else {
    fillEl.classList.remove('warning');
  }
  
  const budgetLabelEl = document.querySelector('.budget-label');
  const budgetLabels = { day: '本日預算使用率', week: '本週預算使用率', month: '本月預算使用率', year: '本年預算使用率' };
  if (budgetLabelEl) budgetLabelEl.innerText = budgetLabels[activePeriod] || '預算使用率';

  if (isPrivacyMode) applyPrivacyMask();
}

// Dynamic SVG Doughnut Pie Chart generator
function renderCategoryPieChart(totalExpense, expenses) {
  const svg = document.getElementById('pie-chart-svg');
  const legendContainer = document.getElementById('chart-legend-container');
  document.getElementById('chart-total-value').innerText = `$${totalExpense.toLocaleString()}`;
  
  // Remove existing dynamically generated path slices
  const paths = svg.querySelectorAll('.chart-slice');
  paths.forEach(p => p.remove());
  legendContainer.innerHTML = '';
  
  if (totalExpense === 0) {
    legendContainer.innerHTML = '<div style="color: var(--text-muted); font-size:13px; text-align:center;">目前無支出數據可供統計</div>';
    return;
  }
  
  // Group expense categories
  const catTotals = {};
  
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  
  // Sort categories by total descending
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  
  // Create SVG slices
  let accumulatedAngle = 0;
  
  sortedCats.forEach(([category, amount], index) => {
    const percentage = amount / totalExpense;
    const color = categoryColors[category] || '#8395a7';
    
    // Draw SVG slice (doughnut style using stroke-dasharray)
    // Radius is 70, center is (100, 100). Circumference = 2 * Math.PI * 70 = 439.82
    const circumference = 439.82;
    const strokeLength = percentage * circumference;
    const strokeOffset = -accumulatedAngle;
    
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '100');
    circle.setAttribute('cy', '100');
    circle.setAttribute('r', '70');
    circle.setAttribute('class', 'chart-slice');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '20');
    circle.setAttribute('stroke-dasharray', `${strokeLength} ${circumference}`);
    circle.setAttribute('stroke-dashoffset', strokeOffset.toString());
    circle.setAttribute('stroke-linecap', percentage === 1 ? 'butt' : 'round');
    
    // Insert before the center label elements so it layers underneath
    svg.appendChild(circle);
    
    accumulatedAngle += strokeLength;
    
    // Build legend
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-left">
        <span class="legend-color-dot" style="background-color: ${color};"></span>
        <span class="legend-name">${category} (${(percentage * 100).toFixed(1)}%)</span>
      </div>
      <span class="legend-value">$${amount.toLocaleString()}</span>
    `;
    legendContainer.appendChild(legendItem);
  });
}

// ==========================================================================
// SVG Dual-Bar Chart (Year View: Income + Expense)
// ==========================================================================
function renderBarChart(displayTx) {
  const pieVisual = document.getElementById('pie-chart-visual');
  const barVisual = document.getElementById('bar-chart-visual');
  const legendContainer = document.getElementById('chart-legend-container');
  const svg = document.getElementById('bar-chart-svg');
  const chartContent = document.querySelector('.chart-content');
  
  pieVisual.style.display = 'none';
  barVisual.style.display = '';
  legendContainer.innerHTML = '';
  chartContent.classList.add('has-bars');
  
  svg.querySelectorAll('.bar-chart-bar, .bar-chart-grid-line, .bar-chart-axis-text, .bar-chart-value-text, .bar-chart-y-label, .bar-chart-legend').forEach(el => el.remove());
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const monthlyIncome = {};
  const monthlyExpense = {};
  for (let m = 1; m <= 12; m++) { monthlyIncome[m] = 0; monthlyExpense[m] = 0; }
  
  displayTx.forEach(t => {
    const d = new Date(t.date + 'T00:00:00');
    if (d.getFullYear() === currentYear) {
      const mIdx = d.getMonth() + 1;
      if (t.type === 'income') {
        monthlyIncome[mIdx] += t.amount;
      } else {
        monthlyExpense[mIdx] += t.amount;
      }
    }
  });
  
  const allValues = [...Object.values(monthlyIncome), ...Object.values(monthlyExpense)];
  const maxAmount = Math.max(1, ...allValues);
  const chartW = 420, chartH = 200;
  const pad = { top: 14, right: 14, bottom: 30, left: 42 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;
  const barCount = 12, slotGap = 5;
  const slotWidth = (plotW - slotGap * (barCount + 1)) / barCount;
  const barInnerGap = 2;
  const barW = (slotWidth - barInnerGap) / 2;
  
  ensureBarGradients(svg);
  
  // Grid lines + Y-axis labels
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH * (4 - i) / 4);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', pad.left); line.setAttribute('y1', y);
    line.setAttribute('x2', chartW - pad.right); line.setAttribute('y2', y);
    line.setAttribute('class', 'bar-chart-grid-line');
    svg.appendChild(line);
    
    const val = Math.round(maxAmount * i / 4);
    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', pad.left - 4); lbl.setAttribute('y', y + 3);
    lbl.setAttribute('class', 'bar-chart-y-label');
    lbl.textContent = val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val;
    svg.appendChild(lbl);
  }
  
  // Legend
  const legendY = 6;
  const leg1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  leg1.setAttribute('x', chartW - 100); leg1.setAttribute('y', legendY);
  leg1.setAttribute('width', 10); leg1.setAttribute('height', 10); leg1.setAttribute('rx', 2);
  leg1.setAttribute('fill', 'url(#bar-income-gradient)');
  leg1.setAttribute('class', 'bar-chart-legend');
  svg.appendChild(leg1);
  const lt1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  lt1.setAttribute('x', chartW - 87); lt1.setAttribute('y', legendY + 9);
  lt1.setAttribute('class', 'bar-chart-axis-text'); lt1.textContent = '收入';
  lt1.setAttribute('class', 'bar-chart-legend');
  svg.appendChild(lt1);
  
  const leg2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  leg2.setAttribute('x', chartW - 52); leg2.setAttribute('y', legendY);
  leg2.setAttribute('width', 10); leg2.setAttribute('height', 10); leg2.setAttribute('rx', 2);
  leg2.setAttribute('fill', 'url(#bar-expense-gradient)');
  leg2.setAttribute('class', 'bar-chart-legend');
  svg.appendChild(leg2);
  const lt2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  lt2.setAttribute('x', chartW - 39); lt2.setAttribute('y', legendY + 9);
  lt2.setAttribute('class', 'bar-chart-axis-text'); lt2.textContent = '支出';
  lt2.setAttribute('class', 'bar-chart-legend');
  svg.appendChild(lt2);
  
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  let hasAlert = false;
  
  for (let m = 1; m <= 12; m++) {
    const slotX = pad.left + slotGap + (m - 1) * (slotWidth + slotGap);
    const incAmt = monthlyIncome[m] || 0;
    const expAmt = monthlyExpense[m] || 0;
    const incH = maxAmount > 0 ? (incAmt / maxAmount) * plotH : 0;
    const expH = maxAmount > 0 ? (expAmt / maxAmount) * plotH : 0;
    const incY = pad.top + plotH - incH;
    const expY = pad.top + plotH - expH;
    const isCurrent = m === currentMonth;
    
    // 80% alert check
    const ratio = incAmt > 0 ? expAmt / incAmt : 0;
    const isAlert = incAmt > 0 && ratio >= 0.8;
    if (isAlert) hasAlert = true;
    
    // Income bar (green gradient)
    const incRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    incRect.setAttribute('x', slotX); incRect.setAttribute('y', incY);
    incRect.setAttribute('width', barW); incRect.setAttribute('height', Math.max(incH, 0.5));
    incRect.setAttribute('rx', 2); incRect.setAttribute('class', 'bar-chart-bar');
    incRect.setAttribute('fill', 'url(#bar-income-gradient)');
    incRect.setAttribute('opacity', isCurrent ? '1' : '0.7');
    svg.appendChild(incRect);
    
    if (incAmt > 0) {
      const vt = createBarValueText(slotX + barW / 2, incY - 12, incAmt);
      vt.setAttribute('fill', '#00E676');
      svg.appendChild(vt);
    }
    
    // Expense bar (cyan gradient or red alert)
    const expX = slotX + barW + barInnerGap;
    const expRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    expRect.setAttribute('x', expX); expRect.setAttribute('y', expY);
    expRect.setAttribute('width', barW); expRect.setAttribute('height', Math.max(expH, 0.5));
    expRect.setAttribute('rx', 2); expRect.setAttribute('class', 'bar-chart-bar');
    expRect.setAttribute('fill', isAlert ? '#FF4D4D' : 'url(#bar-expense-gradient)');
    expRect.setAttribute('opacity', isAlert ? '0.9' : (isCurrent ? '1' : '0.7'));
    svg.appendChild(expRect);
    
    if (expAmt > 0) {
      const vt = createBarValueText(expX + barW / 2, expY - 4, expAmt);
      vt.setAttribute('fill', isAlert ? '#FF4D4D' : 'var(--text-secondary)');
      svg.appendChild(vt);
    }
    
    // X-axis label
    const at = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    at.setAttribute('x', slotX + slotWidth / 2); at.setAttribute('y', chartH - 8);
    at.setAttribute('class', 'bar-chart-axis-text');
    at.textContent = monthNames[m - 1];
    svg.appendChild(at);
  }
  
  const totalExpense = Object.values(monthlyExpense).reduce((a, b) => a + b, 0);
  document.getElementById('chart-total-value').innerText = '$' + totalExpense.toLocaleString();
  
  if (hasAlert) {
    triggerAnimeCustomQuote('哇啊啊！主人快住手！本月的支出已經突破收入的 80% 防線了！再買下去我們下個月就要集體去路上吃土了啦！(崩潰) 😭');
  }
}

function createBarValueText(x, y, amount) {
  const vt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  vt.setAttribute('x', x); vt.setAttribute('y', y);
  vt.setAttribute('class', 'bar-chart-value-text');
  vt.setAttribute('text-anchor', 'middle');
  const fmtVal = amount >= 1000 ? ((amount / 1000).toFixed(1).replace('.0', '') + 'k') : amount;
  vt.textContent = fmtVal;
  return vt;
}

function ensureBarGradients(svg) {
  if (svg.querySelector('#bar-expense-gradient')) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  
  const gIncome = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gIncome.setAttribute('id', 'bar-income-gradient');
  gIncome.setAttribute('x1', '0'); gIncome.setAttribute('x2', '0');
  gIncome.setAttribute('y1', '0'); gIncome.setAttribute('y2', '1');
  gIncome.innerHTML = '<stop offset="0%" stop-color="#00E676" stop-opacity="0.95"/><stop offset="100%" stop-color="#00B0FF" stop-opacity="0.5"/>';
  defs.appendChild(gIncome);
  
  const gExpense = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gExpense.setAttribute('id', 'bar-expense-gradient');
  gExpense.setAttribute('x1', '0'); gExpense.setAttribute('x2', '0');
  gExpense.setAttribute('y1', '0'); gExpense.setAttribute('y2', '1');
  gExpense.innerHTML = '<stop offset="0%" stop-color="#00F2FE" stop-opacity="0.9"/><stop offset="100%" stop-color="#4FACFE" stop-opacity="0.5"/>';
  defs.appendChild(gExpense);
  
  const gExpenseActive = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gExpenseActive.setAttribute('id', 'bar-expense-gradient-active');
  gExpenseActive.setAttribute('x1', '0'); gExpenseActive.setAttribute('x2', '0');
  gExpenseActive.setAttribute('y1', '0'); gExpenseActive.setAttribute('y2', '1');
  gExpenseActive.innerHTML = '<stop offset="0%" stop-color="#00F2FE" stop-opacity="1"/><stop offset="100%" stop-color="#0072FF" stop-opacity="0.8"/>';
  defs.appendChild(gExpenseActive);
  
  svg.insertBefore(defs, svg.firstChild);
}

// ==========================================================================
// Date Helper Functions
// ==========================================================================
function getFormattedDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function getRelativeDateLabel(dateStr) {
  const todayStr = getFormattedDate(0);
  const yesterdayStr = getFormattedDate(1);
  const beforeYesterdayStr = getFormattedDate(2);
  
  if (dateStr === todayStr) return '今日';
  if (dateStr === yesterdayStr) return '昨日';
  if (dateStr === beforeYesterdayStr) return '前天';
  return dateStr;
}

// Update transaction category from dropdown selection
window.updateTransactionCategory = function(id, newCategory) {
  const tx = transactions.find(t => t.id === id);
  if (tx) {
    tx.category = newCategory;
    tx.sub_category = '其他';
    saveTransactionsToStorage();
    updateDashboard();
    patchTransaction(id, { category: newCategory, sub_category: '其他' });
  }
};

// Update transaction payment method from dropdown
window.updateTransactionPayment = function(id, newPayment) {
  const tx = transactions.find(t => t.id === id);
  if (tx) {
    tx.payment_method = newPayment;
    saveTransactionsToStorage();
    patchTransaction(id, { payment_method: newPayment });
  }
};

// Update transaction sub_category from UI selection
window.updateTransactionSubCategory = function(id, newSubCategory) {
  const tx = transactions.find(t => t.id === id);
  if (tx) {
    tx.sub_category = newSubCategory;
    saveTransactionsToStorage();
    updateDashboard();
    patchTransaction(id, { sub_category: newSubCategory });
    if (newSubCategory !== '其他') {
      triggerAnimeCustomQuote(
        animeAssistantQuotes.onSubCategoryDetected[
          Math.floor(Math.random() * animeAssistantQuotes.onSubCategoryDetected.length)
        ]
      );
    }
  }
};

async function patchTransaction(id, fields) {
  try {
    await fetch(`/api/transactions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields)
    });
  } catch (e) {
    console.error('PATCH failed', e);
  }
}

window.handleLedgerCatChange = function(selectEl, txId) {
  if (selectEl.value === ADD_NEW_VALUE) {
    showInlineAddPrompt(selectEl, 'categories', null, (newVal) => {
      window.updateTransactionCategory(txId, newVal);
    });
  } else {
    window.updateTransactionCategory(txId, selectEl.value);
  }
};

window.handleLedgerPayChange = function(selectEl, txId) {
  if (selectEl.value === ADD_NEW_VALUE) {
    showInlineAddPrompt(selectEl, 'accounts', null, (newVal) => {
      window.updateTransactionPayment(txId, newVal);
    });
  } else {
    window.updateTransactionPayment(txId, selectEl.value);
  }
};

// Programmatically trigger native date picker
window.triggerDatePicker = function(id) {
  const picker = document.getElementById(`date-picker-${id}`);
  if (picker) {
    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
    } else {
      picker.click();
    }
  }
};

// Update transaction date from date picker calendar selection
window.updateTransactionDate = function(id, newDate) {
  if (!newDate) return;
  const tx = transactions.find(t => t.id === id);
  if (tx) {
    tx.date = newDate;
    saveTransactionsToStorage();
    updateDashboard();
  }
};

// ==========================================================================
// Transaction Detail Modal
// ==========================================================================
window.openTransactionModal = function(id) {
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;
  currentModalTxId = id;
  renderModalForm(tx);
  document.getElementById('modal-overlay').classList.add('active');
};

function closeTransactionModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  currentModalTxId = null;
}

function renderModalForm(tx) {
  const body = document.getElementById('modal-body');
  const allCategories = getPrimaryCategories();
  if (!allCategories.includes('其他')) allCategories.push('其他');

  let catOptions = '';
  allCategories.forEach(cat => {
    const sel = cat === tx.category ? 'selected' : '';
    catOptions += `<option value="${escapeHtml(cat)}" ${sel}>${escapeHtml(cat)}</option>`;
  });
  catOptions += `<option value="${ADD_NEW_VALUE}" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>`;

  const currentCat = tx.category || '其他';
  const currentSub = tx.sub_category || '其他';
  const l2Options = getSubCategories(currentCat);
  if (!l2Options.includes('其他')) l2Options.push('其他');
  let subCatPillsHTML = '';
  l2Options.forEach(l2 => {
    const active = l2 === currentSub ? ' active' : '';
    subCatPillsHTML += `<span class="sub-cat-pill${active}" id="modal-sub-${l2}" onclick="this.parentElement.querySelectorAll('.sub-cat-pill').forEach(p=>p.classList.remove('active')); this.classList.add('active'); document.getElementById('modal-sub-category').value='${l2}'">${l2}</span>`;
  });

  const allPayments = getPaymentMethods();
  if (!allPayments.includes('其他')) allPayments.push('其他');
  const currentPay = tx.payment_method || '現金';
  let payOptionsHTML = '';
  allPayments.forEach(pm => {
    const sel = pm === currentPay ? 'selected' : '';
    payOptionsHTML += `<option value="${escapeHtml(pm)}" ${sel}>${escapeHtml(pm)}</option>`;
  });
  payOptionsHTML += `<option value="${ADD_NEW_VALUE}" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>`;
  
  body.innerHTML = `
    <div class="modal-field">
      <span class="modal-field-label">原始語音內容</span>
      <div class="modal-transcript">${tx.transcript || '無原始語音紀錄'}</div>
    </div>
    <div class="modal-field-row">
      <div class="modal-field">
        <span class="modal-field-label">類別</span>
        <select id="modal-category" onchange="handleModalCatChange(this)">${catOptions}</select>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">金額</span>
        <input type="text" id="modal-amount" value="${tx.amount.toLocaleString()}" oninput="formatAmountInput(this)">
      </div>
    </div>
    <div class="modal-field" id="modal-sub-cat-field">
      <span class="modal-field-label">子分類</span>
      <div class="sub-cat-pills-row" id="modal-sub-cat-pills">
        ${subCatPillsHTML}
      </div>
      <input type="hidden" id="modal-sub-category" value="${currentSub}">
    </div>
    <div class="modal-field-row">
      <div class="modal-field">
        <span class="modal-field-label">帳戶/工具</span>
        <select id="modal-payment" onchange="handleModalPayChange(this)">${payOptionsHTML}</select>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">商家名稱</span>
        <input type="text" id="modal-merchant" value="${tx.merchant || ''}">
      </div>
    </div>
    <div class="modal-field">
      <span class="modal-field-label">商品細項（逗號分隔）</span>
      <input type="text" id="modal-items" value="${(tx.items || []).join('、')}">
    </div>
    <div class="modal-field-row">
      <div class="modal-field">
        <span class="modal-field-label">日期</span>
        <input type="date" id="modal-date" value="${tx.date}">
      </div>
      <div class="modal-field">
        <span class="modal-field-label">類型</span>
        <select id="modal-type">
          <option value="expense" ${tx.type === 'expense' ? 'selected' : ''}>支出</option>
          <option value="income" ${tx.type === 'income' ? 'selected' : ''}>收入</option>
        </select>
      </div>
    </div>
    <div class="modal-field">
      <span class="modal-field-label">描述</span>
      <input type="text" id="modal-description" value="${tx.description || ''}">
    </div>
  `;
}

function updateModalSubPills(newCategory) {
  const pillRow = document.getElementById('modal-sub-cat-pills');
  const l2List = getSubCategories(newCategory);
  if (!l2List.includes('其他')) l2List.push('其他');
  let html = '';
  l2List.forEach(l2 => {
    const active = l2 === l2List[0] ? ' active' : '';
    html += `<span class="sub-cat-pill${active}" onclick="this.parentElement.querySelectorAll('.sub-cat-pill').forEach(p=>p.classList.remove('active')); this.classList.add('active'); document.getElementById('modal-sub-category').value='${l2}'">${l2}</span>`;
  });
  pillRow.innerHTML = html;
  document.getElementById('modal-sub-category').value = l2List[0];
}

window.handleModalCatChange = function(selectEl) {
  if (selectEl.value === ADD_NEW_VALUE) {
    showInlineAddPrompt(selectEl, 'categories', null, (newVal) => {
      updateModalSubPills(newVal);
      document.getElementById('modal-category').value = newVal;
    });
  } else {
    updateModalSubPills(selectEl.value);
  }
};

window.handleModalPayChange = function(selectEl) {
  if (selectEl.value === ADD_NEW_VALUE) {
    showInlineAddPrompt(selectEl, 'accounts', null, (newVal) => {
      selectEl.value = newVal;
    });
  }
};

function saveModalChanges() {
  const tx = transactions.find(t => t.id === currentModalTxId);
  if (!tx) return;
  
  tx.category = document.getElementById('modal-category').value;
  tx.sub_category = document.getElementById('modal-sub-category').value || '其他';
  tx.amount = parseInt(document.getElementById('modal-amount').value.replace(/,/g, '')) || 0;
  tx.payment_method = document.getElementById('modal-payment').value;
  tx.merchant = document.getElementById('modal-merchant').value;
  tx.description = document.getElementById('modal-description').value;
  tx.date = document.getElementById('modal-date').value;
  tx.type = document.getElementById('modal-type').value;
  
  const itemsRaw = document.getElementById('modal-items').value.trim();
  tx.items = itemsRaw ? itemsRaw.split(/[,、,\s]+/).map(s => s.trim()).filter(Boolean) : [];
  
  saveTransactionsToStorage();
  updateDashboard();
  patchTransaction(currentModalTxId, {
    category: tx.category,
    sub_category: tx.sub_category,
    payment_method: tx.payment_method,
    amount: tx.amount,
    merchant: tx.merchant,
    description: tx.description,
    date: tx.date,
    type: tx.type,
    items: tx.items
  });
  closeTransactionModal();
}

function deleteFromModal() {
  if (!currentModalTxId) return;
  transactions = transactions.filter(t => t.id !== currentModalTxId);
  saveTransactionsToStorage();
  updateDashboard();
  closeTransactionModal();
}

// ==========================================================================
// QR Code Scanner (Taiwan E-Invoice)
// ==========================================================================
function openQrScanner() {
  const overlay = document.getElementById('scanner-modal-overlay');
  overlay.classList.add('active');

  const resultEl = document.getElementById('qr-scan-result');
  resultEl.style.display = 'none';
  resultEl.innerText = '';

  if (!window.Html5Qrcode) {
    resultEl.style.display = '';
    resultEl.style.color = '#FF4D4D';
    resultEl.innerText = 'QR 掃描庫載入失敗，請檢查網路連線。';
    return;
  }

  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear().catch(() => {});
  }

  html5QrcodeScanner = new Html5Qrcode('qr-reader');

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  html5QrcodeScanner.start(
    { facingMode: 'environment' },
    config,
    onQrScanSuccess,
    onQrScanError
  ).catch(err => {
    resultEl.style.display = '';
    resultEl.style.color = '#FFD700';
    resultEl.innerText = '無法啟動相機，請確認已允許相機權限。您也可以手動貼上 QR Code 字串。';

    const manualInput = document.createElement('div');
    manualInput.style.cssText = 'margin-top:10px;display:flex;gap:8px;';
    manualInput.innerHTML = `
      <input type="text" id="manual-qr-input" placeholder="貼上發票 QR Code 左側字串..."
             style="flex:1;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;color:white;font-size:13px;outline:none;">
      <button id="btn-manual-qr-submit" class="btn btn-primary" style="padding:8px 14px;font-size:12px;">提交</button>
    `;
    resultEl.parentNode.appendChild(manualInput);

    document.getElementById('btn-manual-qr-submit').addEventListener('click', () => {
      const qrString = document.getElementById('manual-qr-input').value.trim();
      if (qrString) processQrString(qrString);
    });
  });
}

function onQrScanSuccess(decodedText) {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().catch(() => {});
    html5QrcodeScanner = null;
  }
  processQrString(decodedText);
}

function onQrScanError() {
  // Scanning errors are expected during live preview; silently ignore
}

async function processQrString(qrString) {
  const resultEl = document.getElementById('qr-scan-result');
  resultEl.style.display = '';
  resultEl.style.color = '';
  resultEl.innerText = '⏳ 正在解析發票 QR Code...';

  try {
    const response = await fetch('/api/parse-invoice-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_string: qrString })
    });

    if (response.ok) {
      const data = await response.json();
      const newTx = {
        id: Date.now().toString(),
        date: data.date,
        type: data.type || 'expense',
        amount: parseFloat(data.amount) || 0,
        category: data.category || '日常用品',
        sub_category: data.sub_category || '其他',
        description: data.description || '電子發票',
        payment_method: data.payment_method || '載具',
        merchant: data.merchant || '電子發票',
        transcript: `[掃描發票] ${data.description || ''}`,
        items: data.items || []
      };

      transactions.unshift(newTx);
      syncAccountBalance(newTx.payment_method, newTx.amount, newTx.type);
      saveTransactionsToStorage();
      updateDashboard();

      resultEl.style.color = '#00E676';
      resultEl.innerText = `✅ 發票已入帳！金額: $${newTx.amount.toLocaleString()}`;

      triggerAnimeCustomQuote(
        animeAssistantQuotes.onInvoiceScanned[
          Math.floor(Math.random() * animeAssistantQuotes.onInvoiceScanned.length)
        ]
      );

      setTimeout(closeQrScanner, 1500);
    } else {
      const err = await response.text();
      resultEl.style.color = '#FF4D4D';
      resultEl.innerText = `❌ 發票解析失敗: ${err}`;
    }
  } catch (error) {
    resultEl.style.color = '#FF4D4D';
    resultEl.innerText = `❌ 連線失敗: ${error.message}`;
  }
}

function closeQrScanner() {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.stop().catch(() => {});
    html5QrcodeScanner.clear().catch(() => {});
    html5QrcodeScanner = null;
  }
  document.getElementById('scanner-modal-overlay').classList.remove('active');
  const manualInput = document.getElementById('manual-qr-input');
  if (manualInput) manualInput.parentNode.remove();
}

// ==========================================================================
// Carrier (手機條碼) Binding
// ==========================================================================
function saveCarrierBinding() {
  const barcode = document.getElementById('carrier-barcode').value.trim();
  const pin = document.getElementById('carrier-pin').value.trim();

  if (!barcode) {
    document.getElementById('carrier-status').innerText = '請輸入手機載具條碼';
    document.getElementById('carrier-status').style.color = '#FFD700';
    return;
  }

  if (!pin) {
    document.getElementById('carrier-status').innerText = '請輸入載具驗證碼';
    document.getElementById('carrier-status').style.color = '#FFD700';
    return;
  }

  if (!/^\/[A-Za-z0-9+\/]{7}$/.test(barcode)) {
    document.getElementById('carrier-status').innerText = '條碼格式不符（例：/ABC+123）';
    document.getElementById('carrier-status').style.color = '#FFD700';
    return;
  }

  carrierBarcode = barcode;
  carrierPin = pin;

  localStorage.setItem('voice_finance_carrier', JSON.stringify({
    barcode: carrierBarcode,
    pin: carrierPin
  }));

  document.getElementById('carrier-status').innerText = '✅ 載具已綁定';
  document.getElementById('carrier-status').style.color = '#00E676';

  triggerAnimeCustomQuote('主人！發票已經自動匯入囉！✨');
}

function clearCarrierBinding() {
  carrierBarcode = '';
  carrierPin = '';
  localStorage.removeItem('voice_finance_carrier');
  document.getElementById('carrier-barcode').value = '';
  document.getElementById('carrier-pin').value = '';
  document.getElementById('carrier-status').innerText = '';
}

function loadCarrierFromStorage() {
  const stored = localStorage.getItem('voice_finance_carrier');
  if (stored) {
    try {
      const data = JSON.parse(stored);
      carrierBarcode = data.barcode || '';
      carrierPin = data.pin || '';
      if (carrierBarcode) {
        document.getElementById('carrier-barcode').value = carrierBarcode;
      }
      if (carrierPin) {
        document.getElementById('carrier-pin').value = carrierPin;
      }
      if (carrierBarcode && carrierPin) {
        document.getElementById('carrier-status').innerText = '✅ 載具已綁定';
        document.getElementById('carrier-status').style.color = '#00E676';
      }
    } catch (e) {
      console.error('Failed to parse carrier data', e);
    }
  }
}

// ==========================================================================
// Manual Entry Modal
// ==========================================================================
let manualEntryType = 'expense';

function openManualEntryModal() {
  manualEntryType = 'expense';
  setManualTypeUI('expense');

  document.getElementById('manual-amount').value = '';
  document.getElementById('manual-description').value = '';

  renderSelectWithAdd('manual-payment', 'accounts', null, '現金', () => {});
  renderSelectWithAdd('manual-category', 'categories', null, '餐飲食品', () => {
    updateManualSubCategory();
  });
  renderAccountSelect('manual-from-account', '現金');
  renderAccountSelect('manual-to-account', '');

  updateManualSubCategory();
  showManualFields();

  document.getElementById('manual-entry-overlay').classList.add('active');
  setTimeout(() => document.getElementById('manual-amount').focus(), 100);
}

function renderAccountSelect(selectId, defaultVal) {
  var sel = document.getElementById(selectId);
  sel.innerHTML = '';
  bankAccounts.forEach(function(a) {
    var selAttr = a.name === defaultVal ? ' selected' : '';
    sel.innerHTML += '<option value="' + escapeHtml(a.name) + '"' + selAttr + '>' + escapeHtml(a.name) + ' ($' + a.balance.toLocaleString() + ')</option>';
  });
}

function closeManualEntryModal() {
  document.getElementById('manual-entry-overlay').classList.remove('active');
}

window.setManualType = function(type) {
  manualEntryType = type;
  setManualTypeUI(type);
  showManualFields();
};

function setManualTypeUI(type) {
  document.getElementById('manual-type-tabs').querySelectorAll('.manual-type-tab').forEach(t => t.classList.remove('active'));
  var tab = document.querySelector('.manual-type-tab[data-type="' + type + '"]');
  if (tab) tab.classList.add('active');
}

function showManualFields() {
  var isTransfer = manualEntryType === 'transfer';
  document.getElementById('manual-payment-field').style.display = isTransfer ? 'none' : '';
  document.getElementById('manual-transfer-fields').style.display = isTransfer ? '' : 'none';
  document.getElementById('manual-category-fields').style.display = isTransfer ? 'none' : '';
}

window.updateManualSubCategory = function() {
  const catSelect = document.getElementById('manual-category');
  const cat = catSelect.value;
  if (cat === ADD_NEW_VALUE) return;
  const l2List = getSubCategories(cat);
  if (!l2List.includes('其他')) l2List.push('其他');
  const subSelect = document.getElementById('manual-sub-category');
  subSelect.innerHTML = '';
  l2List.forEach(l2 => {
    subSelect.innerHTML += `<option value="${l2}">${l2}</option>`;
  });
  subSelect.innerHTML += `<option value="${ADD_NEW_VALUE}" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>`;

  const handler = function() {
    if (this.value === ADD_NEW_VALUE) {
      showInlineAddPrompt(this, 'sub', cat, (newVal) => {
        window.updateManualSubCategory();
        this.value = newVal;
      });
    }
  };
  subSelect.removeEventListener('change', subSelect._dynHandler);
  subSelect._dynHandler = handler;
  subSelect.addEventListener('change', handler);
};

function submitManualEntry() {
  var rawVal = document.getElementById('manual-amount').value.replace(/,/g, '');
  var amountVal = parseFloat(rawVal);
  if (!amountVal || amountVal <= 0) {
    triggerAnimeCustomQuote('主人～金額好像還沒填對喔！請確認一下再按確認記帳～🧐');
    return;
  }

  var today = getFormattedDate(0);

  if (manualEntryType === 'transfer') {
    var fromAcc = document.getElementById('manual-from-account').value;
    var toAcc = document.getElementById('manual-to-account').value;
    if (!fromAcc || !toAcc) {
      triggerAnimeCustomQuote('主人～請選擇來源和目的帳戶才能轉帳喔！🧐');
      return;
    }
    if (fromAcc === toAcc) {
      triggerAnimeCustomQuote('主人～來源和目的帳戶不能一樣啦！😅');
      return;
    }

    var fromObj = bankAccounts.find(function(a) { return a.name === fromAcc; });
    if (fromObj && fromObj.balance < amountVal) {
      triggerAnimeCustomQuote('主人～來源帳戶餘額不足，無法完成轉帳！💸');
      return;
    }

    if (fromObj) { fromObj.balance -= amountVal; }
    var toObj = bankAccounts.find(function(a) { return a.name === toAcc; });
    if (toObj) { toObj.balance += amountVal; }
    saveAccountsToStorage();
    renderAccountsPanel();

    transactions.unshift({
      id: Date.now().toString(), date: today, type: 'transfer',
      amount: amountVal, category: '其他', sub_category: '其他',
      description: document.getElementById('manual-description').value.trim() || '轉帳',
      payment_method: fromAcc + ' → ' + toAcc,
      merchant: '轉帳', transcript: '[轉帳] ' + fromAcc + ' → ' + toAcc + ' $' + amountVal.toLocaleString(),
      items: []
    });
    saveTransactionsToStorage();
    updateDashboard();
    triggerAnimeCustomQuote('轉帳成功！主人～資金已經安全送達目的帳戶囉！🔄');
    
    document.getElementById('manual-from-account').value = '';
    document.getElementById('manual-to-account').value = '';
  } else {
    var newTx = {
      id: Date.now().toString(), date: today, type: manualEntryType,
      amount: amountVal,
      category: document.getElementById('manual-category').value || '其他',
      sub_category: document.getElementById('manual-sub-category').value || '其他',
      description: document.getElementById('manual-description').value.trim() || '手動記帳',
      payment_method: document.getElementById('manual-payment').value || '現金',
      merchant: '手動輸入',
      transcript: '[手動記帳] ' + (document.getElementById('manual-description').value.trim() || '手動記帳'),
      items: []
    };
    transactions.unshift(newTx);
    syncAccountBalance(newTx.payment_method, newTx.amount, newTx.type);
    saveTransactionsToStorage();
    updateDashboard();
    triggerAnimeCustomQuote(animeAssistantQuotes.onManualEntry[Math.floor(Math.random() * animeAssistantQuotes.onManualEntry.length)]);
  }

  closeManualEntryModal();
}

// ==========================================================================
// Amount Input Comma Formatter
// ==========================================================================
window.formatAmountInput = function(input) {
  var cursorPos = input.selectionStart;
  var raw = input.value.replace(/,/g, '');
  if (raw === '' || isNaN(raw)) { input.value = raw; return; }
  var beforeLen = input.value.length;
  input.value = parseInt(raw, 10).toLocaleString();
  var diff = input.value.length - beforeLen;
  input.selectionStart = input.selectionEnd = cursorPos + diff;
};

// ==========================================================================
// CSV Export
// ==========================================================================
function exportCSV() {
  var displayTx = getFilteredTransactions();
  if (displayTx.length === 0) {
    triggerAnimeCustomQuote('主人～目前沒有記帳紀錄可以匯出喔！先記幾筆再來匯出吧～📋');
    return;
  }
  var header = '日期,類型,金額,類別,子分類,描述,帳戶/工具,商家\n';
  var rows = displayTx.map(function(t) {
    var sign = t.type === 'income' ? '+' : t.type === 'transfer' ? '±' : '-';
    return [t.date, t.type, sign + t.amount, t.category, t.sub_category || '', t.description, t.payment_method || '', t.merchant || '']
      .map(function(v) { return '"' + v + '"'; }).join(',');
  }).join('\n');
  var csv = '\uFEFF' + header + rows;
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'voice_finance_export_' + getFormattedDate(0) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  triggerAnimeCustomQuote('明細已匯出！主人可以隨時打開 CSV 檔案來分析財務喔～📊');
}

// ==========================================================================
// Bank Account Management
// ==========================================================================
function loadAccountsFromStorage() {
  const stored = localStorage.getItem('voice_finance_bank_accounts');
  if (stored) { try { bankAccounts = JSON.parse(stored); } catch (e) { bankAccounts = []; } }
}

function saveAccountsToStorage() {
  localStorage.setItem('voice_finance_bank_accounts', JSON.stringify(bankAccounts));
}

function renderAccountsPanel() {
  const listEl = document.getElementById('accounts-list');
  const emptyEl = document.getElementById('accounts-empty');
  listEl.innerHTML = '';
  if (bankAccounts.length === 0) { emptyEl.classList.add('active'); return; }
  emptyEl.classList.remove('active');
  bankAccounts.forEach(acc => {
    const typeIcon = acc.type === 'bank' ? 'account_balance' : acc.type === 'wallet' ? 'wallet' : 'savings';
    const row = document.createElement('div');
    row.className = 'account-row';
    row.innerHTML = '<div class="account-info"><span class="material-icons-round account-type-icon">' + typeIcon + '</span><div><span class="account-name">' + escapeHtml(acc.name) + '</span><span class="account-type-badge">' + (acc.type === 'bank' ? '銀行' : acc.type === 'wallet' ? '錢包' : '現金') + '</span></div></div><div class="account-balance"><span class="balance-value" ondblclick="editAccountBalance(\'' + acc.id + '\')" title="雙擊編輯餘額">$' + acc.balance.toLocaleString() + '</span><button class="delete-action-btn" onclick="deleteAccount(\'' + acc.id + '\')"><span class="material-icons-round">delete_outline</span></button></div>';
    listEl.appendChild(row);
  });
  if (isPrivacyMode) applyPrivacyMask();
}

function addAccount() {
  var name = prompt('請輸入帳戶名稱（例如：國泰世華）：');
  if (!name || !name.trim()) return;
  var type = prompt('請輸入帳戶類型（bank/cash/wallet）：', 'bank');
  if (!type) return;
  var balance = parseFloat(prompt('請輸入目前餘額：', '0'));
  bankAccounts.push({ id: Date.now().toString(), name: name.trim(), type: type.trim() || 'bank', balance: isNaN(balance) ? 0 : balance });
  saveAccountsToStorage();
  renderAccountsPanel();
  updateDashboard();
}

function deleteAccount(id) {
  if (confirm('確定要刪除此帳戶嗎？')) {
    bankAccounts = bankAccounts.filter(function(a) { return a.id !== id; });
    saveAccountsToStorage();
    renderAccountsPanel();
    updateDashboard();
  }
}

window.editAccountBalance = function(id) {
  var acc = bankAccounts.find(function(a) { return a.id === id; });
  if (!acc) return;
  var newBalance = prompt('編輯 ' + acc.name + ' 的餘額：', acc.balance);
  if (newBalance === null) return;
  var val = parseFloat(newBalance);
  if (!isNaN(val)) { acc.balance = val; saveAccountsToStorage(); renderAccountsPanel(); updateDashboard(); }
};

function syncAccountBalance(paymentMethod, amount, txType) {
  var acc = bankAccounts.find(function(a) { return a.name === paymentMethod; });
  if (!acc) return;
  if (txType === 'expense') { acc.balance -= amount; } else { acc.balance += amount; }
  saveAccountsToStorage();
  renderAccountsPanel();
}

// ==========================================================================
// Loan Management
// ==========================================================================
function loadLoansFromStorage() {
  var stored = localStorage.getItem('voice_finance_loans');
  if (stored) { try { loans = JSON.parse(stored); } catch (e) { loans = []; } }
}

function saveLoansToStorage() {
  localStorage.setItem('voice_finance_loans', JSON.stringify(loans));
}

function renderLoansPanel() {
  var listEl = document.getElementById('loans-list');
  var emptyEl = document.getElementById('loans-empty');
  listEl.innerHTML = '';
  if (loans.length === 0) { emptyEl.classList.add('active'); return; }
  emptyEl.classList.remove('active');
  loans.forEach(function(loan) {
    var repaidPercent = loan.totalPrincipal > 0 ? Math.round(((loan.totalPrincipal - loan.remainingBalance) / loan.totalPrincipal) * 100) : 0;
    var row = document.createElement('div');
    row.className = 'loan-row';
    var repaidBtn = loan.remainingBalance > 0 ? '<button class="btn btn-success" style="padding:4px 10px;font-size:11px;margin-top:8px;" onclick="makeLoanRepayment(\'' + loan.id + '\')"><span class="material-icons-round" style="font-size:13px;">payments</span> 記錄還款</button>' : '<span style="color:var(--color-income);font-size:11px;"> 已全額還清</span>';
    row.innerHTML = '<div class="loan-header"><span class="loan-name">' + escapeHtml(loan.name) + '</span><span class="loan-due">下期: ' + (loan.nextDueDate || '---') + '</span><button class="delete-action-btn" onclick="deleteLoan(\'' + loan.id + '\')"><span class="material-icons-round">delete_outline</span></button></div><div class="loan-bar-wrapper"><div class="loan-bar-track"><div class="loan-bar-fill" style="width:' + repaidPercent + '%;"></div></div><span class="loan-bar-label">' + repaidPercent + '% 已還</span></div><div class="loan-details"><span>總額: $' + loan.totalPrincipal.toLocaleString() + '</span><span>剩餘: $' + loan.remainingBalance.toLocaleString() + '</span><span>月付: $' + loan.monthlyPayment.toLocaleString() + '</span></div>' + repaidBtn;
    listEl.appendChild(row);
  });
  if (isPrivacyMode) applyPrivacyMask();
}

function addLoan() {
  var name = prompt('請輸入貸款名稱：');
  if (!name || !name.trim()) return;
  var total = parseFloat(prompt('貸款總額：', '0'));
  if (isNaN(total) || total <= 0) return;
  var remaining = parseFloat(prompt('剩餘本金：', total.toString()));
  var monthly = parseFloat(prompt('每月還款金額：', '0'));
  var due = prompt('下次還款日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
  loans.push({ id: Date.now().toString(), name: name.trim(), totalPrincipal: total, remainingBalance: isNaN(remaining) ? total : remaining, monthlyPayment: isNaN(monthly) ? 0 : monthly, nextDueDate: due || '' });
  saveLoansToStorage();
  renderLoansPanel();
}

function deleteLoan(id) {
  if (confirm('確定要刪除此貸款項目嗎？')) {
    loans = loans.filter(function(l) { return l.id !== id; });
    saveLoansToStorage();
    renderLoansPanel();
  }
}

window.makeLoanRepayment = function(id) {
  var loan = loans.find(function(l) { return l.id === id; });
  if (!loan || loan.remainingBalance <= 0) return;
  var amount = Math.min(loan.monthlyPayment, loan.remainingBalance);
  loan.remainingBalance = Math.max(0, loan.remainingBalance - amount);
  var dueDate = new Date(loan.nextDueDate);
  if (!isNaN(dueDate.getTime())) { dueDate.setMonth(dueDate.getMonth() + 1); loan.nextDueDate = dueDate.toISOString().split('T')[0]; }
  saveLoansToStorage();
  renderLoansPanel();
  var today = getFormattedDate(0);
  transactions.unshift({ id: Date.now().toString(), date: today, type: 'expense', amount: amount, category: '居家', sub_category: '其他', description: loan.name + ' 還款', payment_method: '銀行轉帳', merchant: loan.name, transcript: '[貸款還款] ' + loan.name + ' $' + amount, items: [] });
  saveTransactionsToStorage();
  updateDashboard();
  triggerAnimeCustomQuote(animeAssistantQuotes.onLoanRepayment[Math.floor(Math.random() * animeAssistantQuotes.onLoanRepayment.length)]);
};

function checkAutoRepayments() {
  var today = getFormattedDate(0);
  var didRepay = false;
  loans.forEach(function(loan) {
    if (loan.nextDueDate && loan.nextDueDate <= today && loan.remainingBalance > 0) {
      var amount = Math.min(loan.monthlyPayment, loan.remainingBalance);
      loan.remainingBalance = Math.max(0, loan.remainingBalance - amount);
      var dueDate = new Date(loan.nextDueDate);
      if (!isNaN(dueDate.getTime())) { dueDate.setMonth(dueDate.getMonth() + 1); loan.nextDueDate = dueDate.toISOString().split('T')[0]; }
      transactions.unshift({ id: Date.now().toString(), date: today, type: 'expense', amount: amount, category: '居家', sub_category: '其他', description: loan.name + ' 自動還款', payment_method: '銀行轉帳', merchant: loan.name, transcript: '[自動還款] ' + loan.name + ' $' + amount, items: [] });
      didRepay = true;
    }
  });
  if (didRepay) {
    saveLoansToStorage();
    saveTransactionsToStorage();
    updateDashboard();
    renderLoansPanel();
    triggerAnimeCustomQuote(animeAssistantQuotes.onLoanRepayment[Math.floor(Math.random() * animeAssistantQuotes.onLoanRepayment.length)]);
  }
}
