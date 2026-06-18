// ==========================================================================
// VoiceFinance.storage — localStorage CRUD, Dynamic Options, CSV/JSON I/O
// ==========================================================================
(function () {
  window.VoiceFinance = window.VoiceFinance || {};

  // --- Constants ---
  var CORE_SUB_CATEGORIES = {
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
  var CORE_PAYMENT_METHODS = ['現金', '信用卡', '行動支付', '銀行轉帳'];
  var CORE_PRIMARY_CATEGORIES = ['餐飲食品', '交通出行', '日常用品', '娛樂消費', '醫療保健', '教育', '居家', '薪資', '獎金', '投資'];
  var ADD_NEW_VALUE = '__add_new__';
  var _pendingDynamicCallbacks = {};

  // --- Dynamic Options ---
  var dynamicOptions = null;

  function loadDynamicOptions() {
    var stored = localStorage.getItem('voice_finance_dynamic_options');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) {}
    }
    var defaults = {
      accounts: CORE_PAYMENT_METHODS.concat(['其他']),
      categories: CORE_PRIMARY_CATEGORIES.concat(['其他']),
      subCategories: {}
    };
    Object.keys(CORE_SUB_CATEGORIES).forEach(function (cat) {
      defaults.subCategories[cat] = CORE_SUB_CATEGORIES[cat].concat(['其他']);
    });
    return defaults;
  }

  function saveDynamicOptions(opts) {
    localStorage.setItem('voice_finance_dynamic_options', JSON.stringify(opts));
  }

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
    var list = (type === 'sub')
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
    var coreList = type === 'sub' ? CORE_SUB_CATEGORIES[parent] || []
      : type === 'accounts' ? CORE_PAYMENT_METHODS
      : CORE_PRIMARY_CATEGORIES;
    if (coreList.includes(value)) return false;
    var list = (type === 'sub')
      ? dynamicOptions.subCategories[parent]
      : dynamicOptions[type];
    if (!list) return false;
    var idx = list.indexOf(value);
    if (idx >= 0) {
      list.splice(idx, 1);
      saveDynamicOptions(dynamicOptions);
      return true;
    }
    return false;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Render helpers ---
  function renderSelectWithAdd(containerOrId, type, parent, selectedValue, onChangeHandler) {
    var selectEl = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
    if (!selectEl) return;
    var options = getDynamicOptions(type, parent);
    var html = '';
    options.forEach(function (opt) {
      var sel = opt === selectedValue ? ' selected' : '';
      html += '<option value="' + escapeHtml(opt) + '"' + sel + '>' + escapeHtml(opt) + '</option>';
    });
    html += '<option value="' + ADD_NEW_VALUE + '" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>';
    selectEl.innerHTML = html;
    selectEl.dataset.dynType = type;
    selectEl.dataset.dynParent = parent || '';

    var key = type + (parent ? ':' + parent : '');
    if (_pendingDynamicCallbacks[key]) {
      selectEl.removeEventListener('change', _pendingDynamicCallbacks[key]);
    }
    var handler = function () {
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
    var existingPanel = selectEl.parentElement.querySelector('.inline-add-panel');
    if (existingPanel) existingPanel.remove();

    var panel = document.createElement('div');
    panel.className = 'inline-add-panel';
    panel.innerHTML =
      '<input type="text" class="inline-add-input" placeholder="請輸入新項目名稱" maxlength="12">' +
      '<button class="inline-add-confirm btn btn-success" style="padding:4px 10px;font-size:11px;">新增</button>' +
      '<button class="inline-add-cancel btn btn-outline" style="padding:4px 10px;font-size:11px;">取消</button>';
    selectEl.parentElement.appendChild(panel);

    var input = panel.querySelector('.inline-add-input');
    input.focus();
    input.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') panel.querySelector('.inline-add-confirm').click();
    });
    panel.querySelector('.inline-add-confirm').addEventListener('click', function () {
      var val = input.value.trim();
      if (!val) return;
      if (getDynamicOptions(type, parent).includes(val)) {
        if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
          VoiceFinance.anime.triggerCustom('主人～這個名稱已經存在了，換一個試試看吧！😅');
        }
        return;
      }
      addCustomOption(type, parent, val);
      renderSelectWithAdd(selectEl, type, parent, val, onChangeHandler);
      panel.remove();
      selectEl.value = val;
      onChangeHandler(val);
      if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
        VoiceFinance.anime.triggerCustom('主人！新的自訂標籤已經裝進選單了！隨時可以使用它來精確記帳囉！🏷️');
      }
    });
    panel.querySelector('.inline-add-cancel').addEventListener('click', function () {
      panel.remove();
      var options = getDynamicOptions(type, parent);
      selectEl.value = options[options.length - 2] || options[0];
    });
  }

  function renderDeletePanel(type, parent) {
    var key = type + (parent ? ':' + parent : '');
    var existingPanel = document.getElementById('delete-panel-' + key);
    if (existingPanel) { existingPanel.remove(); return; }

    document.querySelectorAll('.custom-delete-panel').forEach(function (p) { p.remove(); });

    var options = getDynamicOptions(type, parent);
    var coreList = type === 'sub' ? (CORE_SUB_CATEGORIES[parent] || []).concat(['其他'])
      : type === 'accounts' ? CORE_PAYMENT_METHODS.concat(['其他'])
      : CORE_PRIMARY_CATEGORIES.concat(['其他']);
    var deletable = options.filter(function (o) { return !coreList.includes(o); });
    if (deletable.length === 0) {
      if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
        VoiceFinance.anime.triggerCustom('目前還沒有自訂項目可以刪除喔～先新增一些再來整理吧！📋');
      }
      return;
    }

    var panel = document.createElement('div');
    panel.id = 'delete-panel-' + key;
    panel.className = 'custom-delete-panel';
    var itemsHTML = deletable.map(function (item) {
      return '<div class="delete-panel-item">' +
        '<span>' + escapeHtml(item) + '</span>' +
        '<button class="delete-panel-x" onclick="event.stopPropagation(); VoiceFinance.storage.removeCustomOption(\'' + type + '\',\'' + (parent || '') + '\',\'' + escapeHtml(item).replace(/'/g, "\\'") + '\'); document.getElementById(\'delete-panel-' + key + '\').remove(); VoiceFinance.storage.triggerRefreshAllSelects()">✕</button>' +
      '</div>';
    }).join('');
    panel.innerHTML = itemsHTML;
    return panel;
  }

  function triggerRefreshAllSelects() {
    saveDynamicOptions(dynamicOptions);
    if (VoiceFinance.updateDashboard) {
      VoiceFinance.updateDashboard();
    }
    if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
      VoiceFinance.anime.triggerCustom('已移除自訂標籤！選單已經更新完畢～✨');
    }
  }

  // --- Backward-compatible wrappers ---
  function getSubCategories(cat) {
    return getDynamicOptions('sub', cat);
  }

  function getPaymentMethods() {
    return getDynamicOptions('accounts');
  }

  function getPrimaryCategories() {
    return getDynamicOptions('categories');
  }

  // --- Date helpers ---
  function getFormattedDate(offsetDays) {
    var d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.getFullYear() + '-' + (d.getMonth() + 1).toString().padStart(2, '0') + '-' + d.getDate().toString().padStart(2, '0');
  }

  function getRelativeDateLabel(dateStr) {
    var todayStr = getFormattedDate(0);
    var yesterdayStr = getFormattedDate(1);
    var beforeYesterdayStr = getFormattedDate(2);

    if (dateStr === todayStr) return '今日';
    if (dateStr === yesterdayStr) return '昨日';
    if (dateStr === beforeYesterdayStr) return '前天';
    return dateStr;
  }

  // --- Transaction storage ---
  function saveTransactionsToStorage() {
    localStorage.setItem('voice_finance_transactions', JSON.stringify(VoiceFinance.state.transactions));
  }

  function loadTransactionsFromStorage() {
    var stored = localStorage.getItem('voice_finance_transactions');
    if (stored) {
      try {
        VoiceFinance.state.transactions = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse transactions", e);
        VoiceFinance.state.transactions = [];
      }
    } else {
      var now = new Date();
      var y = now.getFullYear();
      var m = now.getMonth() + 1;
      var d = now.getDate();
      var pad = function (n) { return n.toString().padStart(2, '0'); };
      var dateOf = function (year, month, day) { return year + '-' + pad(month) + '-' + pad(day); };
      var monthAgo = function (offset) {
        var dt = new Date(y, m - 1 - offset, Math.min(d, 28));
        return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
      };

      VoiceFinance.state.transactions = [
        { id: 'demo0', date: dateOf(y, m, d), type: 'expense', amount: 120, category: '餐飲食品', description: '排骨便當', payment_method: '現金', merchant: '便當店', transcript: '今天中午吃排骨便當花了120元', items: ['排骨便當'] },
        { id: 'demo0b', date: dateOf(y, m, d - 1), type: 'expense', amount: 800, category: '交通出行', description: '中油加滿油', payment_method: '中油Pay / 國泰世華', merchant: '中油', transcript: '用中油Pay加滿油花了800塊', items: ['無鉛汽油'] },
        { id: 'demo0c', date: dateOf(y, m, d - 2), type: 'income', amount: 3000, category: '薪資', description: '兼職收入', payment_method: '現金', merchant: '客戶', transcript: '收到兼職薪水3000元', items: [] },
        { id: 'demo0d', date: dateOf(y, m, d - 3), type: 'expense', amount: 250, category: '日常用品', description: '全聯採買', payment_method: '全支付 / 玉山銀行', merchant: '全聯', transcript: '去全聯買鮮奶和麵包花了250元', items: ['鮮奶', '麵包'] },
        { id: 'demo0e', date: dateOf(y, m, d - 5), type: 'expense', amount: 1500, category: '娛樂消費', description: '電影票+爆米花', payment_method: '信用卡', merchant: '威秀影城', transcript: '看電影買爆米花花了1500元', items: ['電影票', '爆米花'] },
        { id: 'demo1a', date: monthAgo(1), type: 'expense', amount: 3500, category: '居家', description: '房租', payment_method: '轉帳', merchant: '房東', transcript: '繳這個月房租3500元', items: [] },
        { id: 'demo1b', date: monthAgo(1), type: 'expense', amount: 600, category: '餐飲食品', description: '同事聚餐', payment_method: 'LINE Pay', merchant: '火鍋店', transcript: '跟同事吃火鍋花了600元', items: ['火鍋'] },
        { id: 'demo1c', date: monthAgo(1), type: 'income', amount: 15000, category: '薪資', description: '正職薪水', payment_method: '銀行轉帳', merchant: '公司', transcript: '收到正職薪水15000元', items: [] },
        { id: 'demo2a', date: monthAgo(2), type: 'expense', amount: 2200, category: '交通出行', description: '高鐵車票', payment_method: '信用卡', merchant: '高鐵', transcript: '買高鐵來回票花了2200元', items: ['來回票'] },
        { id: 'demo2b', date: monthAgo(2), type: 'expense', amount: 900, category: '醫療保健', description: '看牙醫', payment_method: '現金', merchant: '牙醫診所', transcript: '看牙醫花了900元', items: [] },
        { id: 'demo2c', date: monthAgo(2), type: 'income', amount: 18000, category: '薪資', description: '正職薪水', payment_method: '銀行轉帳', merchant: '公司', transcript: '收到正職薪水18000元', items: [] },
        { id: 'demo3a', date: monthAgo(3), type: 'expense', amount: 4200, category: '教育', description: '線上課程', payment_method: '信用卡', merchant: '線上平台', transcript: '買線上程式課程花了4200元', items: ['課程'] },
        { id: 'demo3b', date: monthAgo(3), type: 'income', amount: 5000, category: '獎金', description: '專案獎金', payment_method: '銀行轉帳', merchant: '公司', transcript: '收到專案獎金5000元', items: [] },
        { id: 'demo5a', date: monthAgo(5), type: 'expense', amount: 6800, category: '居家', description: '買家具', payment_method: '信用卡', merchant: 'IKEA', transcript: '買新書桌和椅子花了6800元', items: ['書桌', '椅子'] },
        { id: 'demo5b', date: monthAgo(5), type: 'income', amount: 22000, category: '薪資', description: '正職薪水+紅利', payment_method: '銀行轉帳', merchant: '公司', transcript: '收到薪水加紅利共22000元', items: [] },
        { id: 'demo8a', date: monthAgo(8), type: 'expense', amount: 12000, category: '其他', description: '年繳保費', payment_method: '信用卡', merchant: '保險公司', transcript: '年繳保險費12000元', items: [] },
        { id: 'demo8b', date: monthAgo(8), type: 'expense', amount: 5000, category: '交通出行', description: '機車維修', payment_method: '現金', merchant: '機車行', transcript: '機車大保養花了5000元', items: ['機油', '輪胎'] },
        { id: 'demo10a', date: monthAgo(10), type: 'expense', amount: 2500, category: '娛樂消費', description: '演唱會門票', payment_method: '信用卡', merchant: '售票平台', transcript: '買演唱會門票花了2500元', items: ['門票'] }
      ];
      saveTransactionsToStorage();
    }
  }

  function getFilteredTransactions() {
    var now = new Date();
    var today = getFormattedDate(0);
    var activePeriod = VoiceFinance.state.activePeriod;
    var transactions = VoiceFinance.state.transactions;

    if (activePeriod === 'day') {
      return transactions.filter(function (t) { return t.date === today; });
    } else if (activePeriod === 'week') {
      var weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      var weekAgoStr = weekAgo.toISOString().split('T')[0];
      return transactions.filter(function (t) { return t.date >= weekAgoStr && t.date <= today; });
    } else if (activePeriod === 'year') {
      var currentYear = now.getFullYear();
      return transactions.filter(function (t) {
        var d = new Date(t.date + 'T00:00:00');
        return d.getFullYear() === currentYear;
      });
    } else {
      var currentMonth = now.getMonth();
      var currentYear2 = now.getFullYear();
      return transactions.filter(function (t) {
        var d = new Date(t.date + 'T00:00:00');
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear2;
      });
    }
  }

  // --- CSV Export ---
  function exportCSV() {
    var displayTx = getFilteredTransactions();
    if (displayTx.length === 0) {
      if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
        VoiceFinance.anime.triggerCustom('主人～目前沒有記帳紀錄可以匯出喔！先記幾筆再來匯出吧～📋');
      }
      return;
    }
    var header = '日期,類型,金額,類別,子分類,描述,帳戶/工具,商家\n';
    var rows = displayTx.map(function (t) {
      var sign = t.type === 'income' ? '+' : t.type === 'transfer' ? '±' : '-';
      return [t.date, t.type, sign + t.amount, t.category, t.sub_category || '', t.description, t.payment_method || '', t.merchant || '']
        .map(function (v) { return '"' + v + '"'; }).join(',');
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
    if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
      VoiceFinance.anime.triggerCustom('明細已匯出！主人可以隨時打開 CSV 檔案來分析財務喔～📊');
    }
  }

  // --- JSON Backup & Restore ---
  function exportJSONBackup() {
    var backup = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      data: {
        transactions: VoiceFinance.state.transactions,
        bank_accounts: VoiceFinance.state.bankAccounts,
        loans: VoiceFinance.state.loans,
        dynamic_options: dynamicOptions,
        carrier: { barcode: VoiceFinance.state.carrierBarcode, pin: VoiceFinance.state.carrierPin }
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
    if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
      VoiceFinance.anime.triggerCustom('帳本備份已下載！主人可以把這個 JSON 檔案安全保存起來囉～💾');
    }
  }

  function importJSONBackup() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (evt) {
        try {
          var backup = JSON.parse(evt.target.result);
          if (!backup.data) throw new Error('Invalid format');
          var d = backup.data;
          if (d.transactions) localStorage.setItem('voice_finance_transactions', JSON.stringify(d.transactions));
          if (d.bank_accounts) localStorage.setItem('voice_finance_bank_accounts', JSON.stringify(d.bank_accounts));
          if (d.loans) localStorage.setItem('voice_finance_loans', JSON.stringify(d.loans));
          if (d.dynamic_options) localStorage.setItem('voice_finance_dynamic_options', JSON.stringify(d.dynamic_options));
          if (d.carrier) localStorage.setItem('voice_finance_carrier', JSON.stringify(d.carrier));
          if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
            VoiceFinance.anime.triggerCustom('帳本還原成功！頁面將重新載入～🔄');
          }
          setTimeout(function () { window.location.reload(); }, 1500);
        } catch (err) {
          if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
            VoiceFinance.anime.triggerCustom('主人～這個檔案格式好像不對喔！請選擇正確的備份檔案～😅');
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // --- Initialize dynamicOptions on load ---
  dynamicOptions = loadDynamicOptions();

  // --- Expose ---
  VoiceFinance.storage = {
    // dynamic options
    getDynamicOptions: getDynamicOptions,
    addCustomOption: addCustomOption,
    removeCustomOption: removeCustomOption,
    renderSelectWithAdd: renderSelectWithAdd,
    showInlineAddPrompt: showInlineAddPrompt,
    renderDeletePanel: renderDeletePanel,
    triggerRefreshAllSelects: triggerRefreshAllSelects,
    getSubCategories: getSubCategories,
    getPaymentMethods: getPaymentMethods,
    getPrimaryCategories: getPrimaryCategories,
    saveDynamicOptions: saveDynamicOptions,
    // data
    saveTransactionsToStorage: saveTransactionsToStorage,
    loadTransactionsFromStorage: loadTransactionsFromStorage,
    getFilteredTransactions: getFilteredTransactions,
    // CSV / JSON
    exportCSV: exportCSV,
    exportJSONBackup: exportJSONBackup,
    importJSONBackup: importJSONBackup,
    // helpers
    escapeHtml: escapeHtml,
    getFormattedDate: getFormattedDate,
    getRelativeDateLabel: getRelativeDateLabel,
    // constants
    ADD_NEW_VALUE: ADD_NEW_VALUE
  };
})();
