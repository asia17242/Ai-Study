// ==========================================================================
// Web-First Voice Finance Application Logic
// ==========================================================================

// Global state variables
let transactions = [];
let isRecording = false;
let recognition = null;

// Category colors mapping (corresponds to CSS colors)
const categoryColors = {
  '餐飲': '#ff9f43',
  '餐飲食品': '#ff9f43',
  '交通': '#54a0ff',
  '交通出行': '#54a0ff',
  '購物': '#1dd1a1',
  '日常用品': '#1dd1a1',
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
    // Insert some initial demo transactions if empty
    transactions = [
      {
        id: 'demo1',
        date: getFormattedDate(0),
        type: 'expense',
        amount: 120,
        category: '餐飲食品',
        description: '吃排骨便當',
        payment_method: '現金'
      },
      {
        id: 'demo2',
        date: getFormattedDate(0),
        type: 'expense',
        amount: 800,
        category: '交通出行',
        description: '中油加滿油',
        payment_method: '電子支付'
      },
      {
        id: 'demo3',
        date: getFormattedDate(0),
        type: 'income',
        amount: 3000,
        category: '薪資',
        description: '兼職外包收入',
        payment_method: '現金'
      }
    ];
    saveTransactionsToStorage();
  }
}

function saveTransactionsToStorage() {
  localStorage.setItem('voice_finance_transactions', JSON.stringify(transactions));
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
        parseVoiceTransaction(recognizedText);
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
      
      // Add successful transaction to lists
      const newTx = {
        id: Date.now().toString(),
        date: data.date || today,
        type: data.type || 'expense',
        amount: parseFloat(data.amount) || 0,
        category: data.category || '其他',
        description: data.description || text,
        payment_method: data.payment_method || '現金'
      };
      
      transactions.unshift(newTx);
      saveTransactionsToStorage();
      updateDashboard();
      
      statusEl.innerHTML = `✅ 記帳成功！<b>$${newTx.amount}</b> (${newTx.category})`;
      
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
// UI Updates & Dynamic Statistics
// ==========================================================================
function updateDashboard() {
  // 1. Calculate Sums
  let totalIncome = 0;
  let totalExpense = 0;
  
  transactions.forEach(t => {
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
  
  if (transactions.length === 0) {
    noRecordsEl.classList.add('active');
  } else {
    noRecordsEl.classList.remove('active');
    
    transactions.forEach(t => {
      const tr = document.createElement('tr');
      
      const icon = categoryIcons[t.category] || 'category';
      const color = categoryColors[t.category] || '#8395a7';
      const dateDisplay = getRelativeDateLabel(t.date);
      const isExpense = t.type === 'expense';
      
      tr.innerHTML = `
        <td>
          <div class="cat-column">
            <div class="cat-icon-circle" style="background-color: ${color}20; color: ${color};">
              <span class="material-icons-round">${icon}</span>
            </div>
            <div class="cat-info">
              <span class="cat-name">${t.category}</span>
              <span class="tx-date">${dateDisplay}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="desc-text">${t.description}</span>
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
          <button class="delete-action-btn" onclick="deleteTransaction('${t.id}')">
            <span class="material-icons-round">delete_outline</span>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
  }
  
  // 4. Update Pie Chart
  renderCategoryPieChart(totalExpense);
}

// Dynamic SVG Doughnut Pie Chart generator
function renderCategoryPieChart(totalExpense) {
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
  const expenses = transactions.filter(t => t.type === 'expense');
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
    const strokeOffset = circumference - accumulatedAngle + (circumference * 0.25); // shift 90 deg back
    
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
// Date Helper Functions
// ==========================================================================
function getFormattedDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padLeft(2, '0')}-${d.getDate().toString().padLeft(2, '0')}`;
}

String.prototype.padLeft = function(size, char) {
  let s = this;
  while (s.length < size) s = char + s;
  return s;
};

function getRelativeDateLabel(dateStr) {
  const todayStr = getFormattedDate(0);
  const yesterdayStr = getFormattedDate(1);
  const beforeYesterdayStr = getFormattedDate(2);
  
  if (dateStr === todayStr) return '今日';
  if (dateStr === yesterdayStr) return '昨日';
  if (dateStr === beforeYesterdayStr) return '前天';
  return dateStr;
}
