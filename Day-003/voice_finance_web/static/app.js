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

// ==========================================================================
// Initialize App
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadTransactionsFromStorage();
  initSpeechRecognition();
  bindUIEvents();
  updateDashboard();
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
        description: data.description || text,
        payment_method: data.payment_method || '現金',
        merchant: data.merchant || '未知',
        transcript: text,
        items: data.items || []
      };
      
      transactions.unshift(newTx);
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
      const standardCategories = ['餐飲食品', '交通出行', '日常用品', '娛樂消費', '醫療保健', '教育', '居家', '薪資', '獎金', '投資', '其他'];
      const currentCat = t.category || '其他';
      const displayCategories = standardCategories.includes(currentCat) ? standardCategories : [currentCat, ...standardCategories];
      
      let categoryOptionsHTML = '';
      displayCategories.forEach(cat => {
        const selected = cat === currentCat ? 'selected' : '';
        categoryOptionsHTML += `<option value="${cat}" ${selected}>${cat}</option>`;
      });
      
      tr.innerHTML = `
        <td>
          <div class="cat-column">
            <div class="cat-icon-circle" style="background-color: ${color}20; color: ${color};">
              <span class="material-icons-round">${icon}</span>
            </div>
            <div class="cat-info">
              <select class="cat-select" onchange="updateTransactionCategory('${t.id}', this.value)">
                ${categoryOptionsHTML}
              </select>
              <div class="tx-date-wrapper">
                <span class="tx-date-label" onclick="triggerDatePicker('${t.id}')">${dateDisplay}</span>
                <input type="date" id="date-picker-${t.id}" class="tx-date-hidden-input" value="${t.date}" onchange="updateTransactionDate('${t.id}', this.value)">
              </div>
            </div>
          </div>
        </td>
        <td>
          <span class="desc-text">${t.description}</span>
          ${t.items && t.items.length > 0 ? `
            <div class="sub-items-row">
              ${t.items.map(item => `<span class="sub-item-tag">${item}</span>`).join('')}
            </div>
          ` : ''}
        </td>
        <td>
          <span class="pay-badge">${t.payment_method || '現金'}</span>
        </td>
        <td>
          <span class="amt-text ${isExpense ? 'expense-color' : 'income-color'}">
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
    saveTransactionsToStorage();
    updateDashboard();
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
  const standardCategories = ['餐飲食品', '交通出行', '日常用品', '娛樂消費', '醫療保健', '教育', '居家', '薪資', '獎金', '投資', '其他'];
  
  let catOptions = '';
  standardCategories.forEach(cat => {
    const sel = cat === tx.category ? 'selected' : '';
    catOptions += `<option value="${cat}" ${sel}>${cat}</option>`;
  });
  
  body.innerHTML = `
    <div class="modal-field">
      <span class="modal-field-label">原始語音內容</span>
      <div class="modal-transcript">${tx.transcript || '無原始語音紀錄'}</div>
    </div>
    <div class="modal-field-row">
      <div class="modal-field">
        <span class="modal-field-label">類別</span>
        <select id="modal-category">${catOptions}</select>
      </div>
      <div class="modal-field">
        <span class="modal-field-label">金額</span>
        <input type="number" id="modal-amount" value="${tx.amount}" min="0">
      </div>
    </div>
    <div class="modal-field-row">
      <div class="modal-field">
        <span class="modal-field-label">帳戶/工具</span>
        <input type="text" id="modal-payment" value="${tx.payment_method || ''}">
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

function saveModalChanges() {
  const tx = transactions.find(t => t.id === currentModalTxId);
  if (!tx) return;
  
  tx.category = document.getElementById('modal-category').value;
  tx.amount = parseInt(document.getElementById('modal-amount').value) || 0;
  tx.payment_method = document.getElementById('modal-payment').value;
  tx.merchant = document.getElementById('modal-merchant').value;
  tx.description = document.getElementById('modal-description').value;
  tx.date = document.getElementById('modal-date').value;
  tx.type = document.getElementById('modal-type').value;
  
  const itemsRaw = document.getElementById('modal-items').value.trim();
  tx.items = itemsRaw ? itemsRaw.split(/[,、,\s]+/).map(s => s.trim()).filter(Boolean) : [];
  
  saveTransactionsToStorage();
  updateDashboard();
  closeTransactionModal();
}

function deleteFromModal() {
  if (!currentModalTxId) return;
  transactions = transactions.filter(t => t.id !== currentModalTxId);
  saveTransactionsToStorage();
  updateDashboard();
  closeTransactionModal();
}
