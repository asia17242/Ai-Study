// ==========================================================================
// VoiceFinance App — State, UI, Voice, Modals, Accounts, Loans
// ==========================================================================
(function () {
  window.VoiceFinance = window.VoiceFinance || {};

  var $s = VoiceFinance.storage;
  var $a = VoiceFinance.anime;
  var $c = VoiceFinance.charts;

  var MONTHLY_BUDGET = 10000;

  // --- Shared State ---
  VoiceFinance.state = {
    transactions: [],
    isRecording: false,
    recognition: null,
    activePeriod: 'month',
    currentModalTxId: null,
    pendingRecurringTx: null,
    html5QrcodeScanner: null,
    carrierBarcode: '',
    carrierPin: '',
    bankAccounts: [],
    loans: [],
    isPrivacyMode: false,
    manualEntryType: 'expense'
  };

  var st = VoiceFinance.state;

  // ======================================================================
  // Privacy Masking
  // ======================================================================
  function togglePrivacyMode() {
    st.isPrivacyMode = !st.isPrivacyMode;
    var icon = document.getElementById('privacy-toggle-icon');
    if (icon) {
      icon.textContent = st.isPrivacyMode ? 'visibility_off' : 'visibility';
    }
    updateDashboard();
    renderAccountsPanel();
    renderLoansPanel();
  }

  function applyPrivacyMask() {
    var selectors = [
      '#total-balance', '#total-income', '#total-expense',
      '#chart-total-value', '.amt-text', '.legend-value',
      '.balance-value', '#budget-percent'
    ];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.dataset.originalText) {
          el.dataset.originalText = el.textContent;
        }
        el.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
        el.classList.add('privacy-masked');
      });
    });

    document.querySelectorAll('.loan-details span').forEach(function (el) {
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent;
      }
      el.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
      el.classList.add('privacy-masked');
    });

    document.querySelectorAll('.loan-bar-label').forEach(function (el) {
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent;
      }
      el.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
      el.classList.add('privacy-masked');
    });

    document.querySelectorAll('.bar-chart-value-text').forEach(function (el) {
      if (!el.dataset.originalText_privacy) {
        el.dataset.originalText_privacy = el.textContent;
      }
      el.textContent = '\u2022\u2022\u2022';
      el.setAttribute('data-privacy-masked', '1');
    });
  }

  function removePrivacyMask() {
    document.querySelectorAll('.privacy-masked').forEach(function (el) {
      if (el.dataset.originalText) {
        el.textContent = el.dataset.originalText;
        delete el.dataset.originalText;
      }
      el.classList.remove('privacy-masked');
    });
    document.querySelectorAll('[data-privacy-masked="1"]').forEach(function (el) {
      if (el.dataset.originalText_privacy) {
        el.textContent = el.dataset.originalText_privacy;
        delete el.dataset.originalText_privacy;
      }
      el.removeAttribute('data-privacy-masked');
    });
  }

  // ======================================================================
  // Inline Ledger Row Editing
  // ======================================================================
  VoiceFinance.startInlineDescEdit = function (spanEl, txId) {
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

    input.addEventListener('blur', function () {
      finishInlineDescEdit(input, txId, originalText);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { input.blur(); }
      if (e.key === 'Escape') {
        input.value = originalText;
        input.blur();
      }
    });
  };

  function finishInlineDescEdit(input, txId, originalValue) {
    var newValue = input.value.trim();
    var span = document.createElement('span');
    span.className = 'desc-text';
    span.textContent = newValue || originalValue;
    span.setAttribute('ondblclick', "VoiceFinance.startInlineDescEdit(this, '" + txId + "')");
    if (st.isPrivacyMode) {
      span.dataset.originalText = newValue || originalValue;
      span.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
      span.classList.add('privacy-masked');
    }
    input.replaceWith(span);

    if (newValue && newValue !== originalValue) {
      var tx = st.transactions.find(function (t) { return t.id === txId; });
      if (tx) {
        tx.description = newValue;
        $s.saveTransactionsToStorage();
        patchTransaction(txId, { description: newValue });
      }
    }
  }

  VoiceFinance.startInlineAmtEdit = function (spanEl, txId) {
    if (spanEl.querySelector('input')) return;
    var originalText = spanEl.dataset.originalText || spanEl.textContent;
    var tx = st.transactions.find(function (t) { return t.id === txId; });
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

    input.addEventListener('blur', function () {
      finishInlineAmtEdit(input, txId, originalText, tx);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { input.blur(); }
      if (e.key === 'Escape') {
        input.value = tx.amount.toString();
        input.blur();
      }
    });
  };

  function finishInlineAmtEdit(input, txId, originalText, tx) {
    var rawVal = input.value.replace(/,/g, '');
    var amountVal = parseFloat(rawVal);
    var isExpense = tx.type === 'expense';

    if (isNaN(amountVal) || amountVal <= 0) {
      $a.triggerCustom('主人～金額只能輸入數字喔！請重新輸入～🧐');
      var span = document.createElement('span');
      span.className = 'amt-text ' + (isExpense ? 'expense-color' : 'income-color');
      span.textContent = (isExpense ? '-' : '+') + '$' + tx.amount.toLocaleString();
      span.setAttribute('ondblclick', "VoiceFinance.startInlineAmtEdit(this, '" + txId + "')");
      if (st.isPrivacyMode) {
        span.dataset.originalText = span.textContent;
        span.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022';
        span.classList.add('privacy-masked');
      }
      input.replaceWith(span);
      return;
    }

    tx.amount = amountVal;
    $s.saveTransactionsToStorage();
    patchTransaction(txId, { amount: amountVal });
    updateDashboard();
  }

  // ======================================================================
  // API
  // ======================================================================
  async function parseVoiceTransaction(text) {
    var statusEl = document.getElementById('mic-status');
    statusEl.innerText = '⏳ 後端 AI 正在分析語意...';

    var today = $s.getFormattedDate(0);

    try {
      var response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, current_date: today })
      });

      if (response.ok) {
        var data = await response.json();

        if (data.is_recurring) {
          st.pendingRecurringTx = {
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

        var newTx = {
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

        st.transactions.unshift(newTx);
        syncAccountBalance(newTx.payment_method, newTx.amount, newTx.type);
        $s.saveTransactionsToStorage();
        updateDashboard();

        statusEl.innerHTML = '✅ 記帳成功！<b>$' + newTx.amount + '</b> (' + newTx.category + ')';

        $a.triggerQuote(newTx.type === 'income' ? 'onIncomeSubmitted' : 'onExpenseSubmitted');

        document.getElementById('manual-text-input').value = '';
      } else {
        var err = await response.text();
        statusEl.innerText = '❌ API 解析失敗: ' + err;
      }
    } catch (error) {
      console.error('API Error', error);
      statusEl.innerText = '❌ 連線後端伺服器失敗: ' + error.message;
    }
  }

  VoiceFinance.deleteTransaction = function (id) {
    st.transactions = st.transactions.filter(function (t) { return t.id !== id; });
    $s.saveTransactionsToStorage();
    updateDashboard();
  };

  async function patchTransaction(id, fields) {
    try {
      await fetch('/api/transactions/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
    } catch (e) {
      console.error('PATCH failed', e);
    }
  }

  // ======================================================================
  // Transcript Actions
  // ======================================================================
  function showTranscriptActions() {
    document.getElementById('transcript-actions').style.display = 'flex';
  }

  function hideTranscriptActions() {
    document.getElementById('transcript-actions').style.display = 'none';
    var transcriptEl = document.getElementById('transcript-text');
    transcriptEl.contentEditable = 'false';
    var btnEdit = document.getElementById('btn-edit-transcript');
    btnEdit.innerHTML = '<span class="material-icons-round" style="font-size:14px;">edit</span> 手動修正';
  }

  function toggleEditMode() {
    var transcriptEl = document.getElementById('transcript-text');
    var btnEdit = document.getElementById('btn-edit-transcript');
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
    var text = document.getElementById('transcript-text').innerText.trim();
    if (text && text !== '聽取中...') {
      parseVoiceTransaction(text);
    }
    resetTranscript();
  }

  function resetTranscript() {
    var transcriptEl = document.getElementById('transcript-text');
    transcriptEl.innerText = '您說的話將在此即時顯示...';
    transcriptEl.classList.add('transcript-placeholder');
    transcriptEl.contentEditable = 'false';
    hideTranscriptActions();
    document.getElementById('mic-status').innerText = '點選按鈕開始錄音';
  }

  // ======================================================================
  // Recurring Transaction Setup
  // ======================================================================
  function showRecurringSetup(dayOfPeriod, frequency, currentDate) {
    document.getElementById('recurring-setup').style.display = 'block';
    document.getElementById('transcript-actions').style.display = 'none';

    var startInput = document.getElementById('recurring-start-date');
    startInput.value = currentDate.substring(0, 7);

    var freqDisplay = document.getElementById('recurring-frequency-display');
    var day = dayOfPeriod || 1;
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
    st.pendingRecurringTx = null;
  }

  function confirmRecurringTransaction() {
    if (!st.pendingRecurringTx) return;

    var startDate = document.getElementById('recurring-start-date').value + '-01';
    var endType = document.getElementById('recurring-end-type').value;
    var endDate = null;

    if (endType === 'custom') {
      endDate = document.getElementById('recurring-end-date').value + '-01';
    }

    var tx = Object.assign({}, st.pendingRecurringTx, {
      date: startDate,
      startDate: startDate,
      endDate: endDate,
      isRecurring: true
    });

    st.transactions.unshift(tx);
    $s.saveTransactionsToStorage();
    updateDashboard();

    document.getElementById('mic-status').innerHTML = '✅ 定期交易已建立！<b>$' + tx.amount + '</b> (' + tx.category + ') 每月' + (st.pendingRecurringTx.dayOfPeriod || 1) + '日';
    document.getElementById('manual-text-input').value = '';
    hideRecurringSetup();
  }

  function cancelRecurringTransaction() {
    document.getElementById('mic-status').innerText = '已取消定期交易設定';
    hideRecurringSetup();
  }

  // ======================================================================
  // Dashboard Update
  // ======================================================================
  VoiceFinance.updateDashboard = updateDashboard;
  function updateDashboard() {
    var displayTx = $s.getFilteredTransactions();

    var titleEl = document.getElementById('ledger-section-title');
    var titles = { day: '本日記帳明細列表', week: '本週記帳明細列表', month: '本月記帳明細列表', year: '本年記帳明細列表' };
    if (titleEl) titleEl.innerText = titles[st.activePeriod] || '記帳明細列表';

    var totalIncome = 0;
    var totalExpense = 0;

    displayTx.forEach(function (t) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    var balance = totalIncome - totalExpense;

    document.getElementById('total-balance').innerText = '$' + balance.toLocaleString();
    document.getElementById('total-income').innerText = '$' + totalIncome.toLocaleString();
    document.getElementById('total-expense').innerText = '$' + totalExpense.toLocaleString();

    var balanceStatus = document.getElementById('balance-status');
    if (balance >= 0) {
      balanceStatus.innerText = '狀態良好';
      balanceStatus.className = 'trend-text positive';
    } else {
      balanceStatus.innerText = '帳戶透支';
      balanceStatus.className = 'trend-text negative';
    }

    var tbody = document.getElementById('transaction-list-body');
    var noRecordsEl = document.getElementById('no-records-placeholder');
    tbody.innerHTML = '';

    if (displayTx.length === 0) {
      noRecordsEl.classList.add('active');
    } else {
      noRecordsEl.classList.remove('active');

      displayTx.forEach(function (t) {
        var tr = document.createElement('tr');

        var icon = $c.icons[t.category] || 'category';
        var color = $c.colors[t.category] || '#8395a7';
        var dateDisplay = $s.getRelativeDateLabel(t.date);
        var isExpense = t.type === 'expense';

        var allCategories = $s.getPrimaryCategories();
        ['其他'].forEach(function (c) { if (!allCategories.includes(c)) allCategories.push(c); });
        var currentCat = t.category || '其他';
        var displayCategories = allCategories.includes(currentCat) ? allCategories : [currentCat].concat(allCategories);

        var categoryOptionsHTML = '';
        displayCategories.forEach(function (cat) {
          var selected = cat === currentCat ? 'selected' : '';
          categoryOptionsHTML += '<option value="' + $s.escapeHtml(cat) + '" ' + selected + '>' + $s.escapeHtml(cat) + '</option>';
        });
        categoryOptionsHTML += '<option value="' + $s.ADD_NEW_VALUE + '" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>';

        var currentSub = t.sub_category || '其他';
        var l2Options = $s.getSubCategories(currentCat);
        if (!l2Options.includes('其他')) l2Options.push('其他');
        var subCategoryPillsHTML = '';
        l2Options.forEach(function (l2) {
          var active = l2 === currentSub ? ' active' : '';
          subCategoryPillsHTML += '<span class="sub-cat-pill' + active + '" onclick="event.stopPropagation(); VoiceFinance.updateTransactionSubCategory(\'' + t.id + '\', \'' + l2 + '\')">' + l2 + '</span>';
        });

        var allPayments = $s.getPaymentMethods();
        if (!allPayments.includes('其他')) allPayments.push('其他');

        tr.innerHTML =
          '<td>' +
            '<div class="cat-column">' +
              '<div class="cat-icon-circle" style="background-color: ' + color + '20; color: ' + color + ';">' +
                '<span class="material-icons-round">' + icon + '</span>' +
              '</div>' +
              '<div class="cat-info">' +
                '<select class="cat-select" onchange="VoiceFinance.handleLedgerCatChange(this, \'' + t.id + '\')">' +
                  categoryOptionsHTML +
                '</select>' +
                '<div class="sub-cat-pills-row">' +
                  subCategoryPillsHTML +
                '</div>' +
                '<div class="tx-date-wrapper">' +
                  '<span class="tx-date-label" onclick="VoiceFinance.triggerDatePicker(\'' + t.id + '\')">' + dateDisplay + '</span>' +
                  '<input type="date" id="date-picker-' + t.id + '" class="tx-date-hidden-input" value="' + t.date + '" onchange="VoiceFinance.updateTransactionDate(\'' + t.id + '\', this.value)">' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td>' +
            '<span class="desc-text" ondblclick="VoiceFinance.startInlineDescEdit(this, \'' + t.id + '\')">' + t.description + '</span>' +
            (t.items && t.items.length > 0 ?
              '<div class="sub-items-row">' +
                t.items.map(function (item) { return '<span class="sub-item-tag">' + $s.escapeHtml(item) + '</span>'; }).join('') +
              '</div>'
            : '') +
          '</td>' +
          '<td>' +
            '<select class="pay-select" onchange="VoiceFinance.handleLedgerPayChange(this, \'' + t.id + '\')">' +
              allPayments.map(function (pm) {
                var currentPay = t.payment_method || '現金';
                var sel = pm === currentPay ? 'selected' : '';
                return '<option value="' + $s.escapeHtml(pm) + '" ' + sel + '>' + $s.escapeHtml(pm) + '</option>';
              }).join('') +
              '<option value="' + $s.ADD_NEW_VALUE + '" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>' +
            '</select>' +
          '</td>' +
          '<td>' +
            '<span class="amt-text ' + (isExpense ? 'expense-color' : 'income-color') + '" ondblclick="VoiceFinance.startInlineAmtEdit(this, \'' + t.id + '\')">' +
              (isExpense ? '-' : '+') + '$' + t.amount.toLocaleString() +
            '</span>' +
          '</td>' +
          '<td>' +
            '<button class="detail-action-btn" onclick="event.stopPropagation(); VoiceFinance.openTransactionModal(\'' + t.id + '\')">' +
              '<span class="material-icons-round">open_in_new</span>' +
            '</button>' +
            '<button class="delete-action-btn" onclick="VoiceFinance.deleteTransaction(\'' + t.id + '\')">' +
              '<span class="material-icons-round">delete_outline</span>' +
            '</button>' +
          '</td>';

        tbody.appendChild(tr);
      });
    }

    var displayExpenses = displayTx.filter(function (t) { return t.type === 'expense'; });
    var chartContent = document.querySelector('.chart-content');

    if (st.activePeriod === 'year') {
      $c.renderBar(displayTx);
    } else {
      document.getElementById('pie-chart-visual').style.display = '';
      document.getElementById('bar-chart-visual').style.display = 'none';
      document.getElementById('chart-legend-container').style.display = '';
      if (chartContent) chartContent.classList.remove('has-bars');
      $c.renderPie(totalExpense, displayExpenses);
    }

    var periodBudget = st.activePeriod === 'day' ? Math.round(MONTHLY_BUDGET / 30) :
                       st.activePeriod === 'week' ? Math.round(MONTHLY_BUDGET / 4.33) :
                       st.activePeriod === 'year' ? MONTHLY_BUDGET * 12 :
                       MONTHLY_BUDGET;
    var spendRatio = totalExpense / periodBudget;
    var percent = Math.min(Math.round(spendRatio * 100), 100);
    document.getElementById('budget-percent').innerText = percent + '%';
    var fillEl = document.getElementById('budget-progress-fill');
    fillEl.style.width = percent + '%';
    if (spendRatio > 0.8) {
      fillEl.classList.add('warning');
    } else {
      fillEl.classList.remove('warning');
    }

    var budgetLabelEl = document.querySelector('.budget-label');
    var budgetLabels = { day: '本日預算使用率', week: '本週預算使用率', month: '本月預算使用率', year: '本年預算使用率' };
    if (budgetLabelEl) budgetLabelEl.innerText = budgetLabels[st.activePeriod] || '預算使用率';

    if (st.isPrivacyMode) applyPrivacyMask();
  }

  // ======================================================================
  // Transaction Category / Payment / Sub Updates
  // ======================================================================
  VoiceFinance.updateTransactionCategory = function (id, newCategory) {
    var tx = st.transactions.find(function (t) { return t.id === id; });
    if (tx) {
      tx.category = newCategory;
      tx.sub_category = '其他';
      $s.saveTransactionsToStorage();
      updateDashboard();
      patchTransaction(id, { category: newCategory, sub_category: '其他' });
    }
  };

  VoiceFinance.updateTransactionPayment = function (id, newPayment) {
    var tx = st.transactions.find(function (t) { return t.id === id; });
    if (tx) {
      tx.payment_method = newPayment;
      $s.saveTransactionsToStorage();
      patchTransaction(id, { payment_method: newPayment });
    }
  };

  VoiceFinance.updateTransactionSubCategory = function (id, newSubCategory) {
    var tx = st.transactions.find(function (t) { return t.id === id; });
    if (tx) {
      tx.sub_category = newSubCategory;
      $s.saveTransactionsToStorage();
      updateDashboard();
      patchTransaction(id, { sub_category: newSubCategory });
      if (newSubCategory !== '其他') {
        var quotes = $a.quotes.onSubCategoryDetected;
        $a.triggerCustom(quotes[Math.floor(Math.random() * quotes.length)]);
      }
    }
  };

  VoiceFinance.handleLedgerCatChange = function (selectEl, txId) {
    if (selectEl.value === $s.ADD_NEW_VALUE) {
      $s.showInlineAddPrompt(selectEl, 'categories', null, function (newVal) {
        VoiceFinance.updateTransactionCategory(txId, newVal);
      });
    } else {
      VoiceFinance.updateTransactionCategory(txId, selectEl.value);
    }
  };

  VoiceFinance.handleLedgerPayChange = function (selectEl, txId) {
    if (selectEl.value === $s.ADD_NEW_VALUE) {
      $s.showInlineAddPrompt(selectEl, 'accounts', null, function (newVal) {
        VoiceFinance.updateTransactionPayment(txId, newVal);
      });
    } else {
      VoiceFinance.updateTransactionPayment(txId, selectEl.value);
    }
  };

  VoiceFinance.triggerDatePicker = function (id) {
    var picker = document.getElementById('date-picker-' + id);
    if (picker) {
      if (typeof picker.showPicker === 'function') {
        picker.showPicker();
      } else {
        picker.click();
      }
    }
  };

  VoiceFinance.updateTransactionDate = function (id, newDate) {
    if (!newDate) return;
    var tx = st.transactions.find(function (t) { return t.id === id; });
    if (tx) {
      tx.date = newDate;
      $s.saveTransactionsToStorage();
      updateDashboard();
    }
  };

  // ======================================================================
  // Transaction Detail Modal
  // ======================================================================
  VoiceFinance.openTransactionModal = function (id) {
    var tx = st.transactions.find(function (t) { return t.id === id; });
    if (!tx) return;
    st.currentModalTxId = id;
    renderModalForm(tx);
    document.getElementById('modal-overlay').classList.add('active');
  };

  function closeTransactionModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    st.currentModalTxId = null;
  }

  function renderModalForm(tx) {
    var body = document.getElementById('modal-body');
    var allCategories = $s.getPrimaryCategories();
    if (!allCategories.includes('其他')) allCategories.push('其他');

    var catOptions = '';
    allCategories.forEach(function (cat) {
      var sel = cat === tx.category ? 'selected' : '';
      catOptions += '<option value="' + $s.escapeHtml(cat) + '" ' + sel + '>' + $s.escapeHtml(cat) + '</option>';
    });
    catOptions += '<option value="' + $s.ADD_NEW_VALUE + '" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>';

    var currentCat = tx.category || '其他';
    var currentSub = tx.sub_category || '其他';
    var l2Options = $s.getSubCategories(currentCat);
    if (!l2Options.includes('其他')) l2Options.push('其他');
    var subCatPillsHTML = '';
    l2Options.forEach(function (l2) {
      var active = l2 === currentSub ? ' active' : '';
      subCatPillsHTML += '<span class="sub-cat-pill' + active + '" id="modal-sub-' + l2 + '" onclick="this.parentElement.querySelectorAll(\'.sub-cat-pill\').forEach(function(p){p.classList.remove(\'active\')}); this.classList.add(\'active\'); document.getElementById(\'modal-sub-category\').value=\'' + l2 + '\'">' + l2 + '</span>';
    });

    var allPayments = $s.getPaymentMethods();
    if (!allPayments.includes('其他')) allPayments.push('其他');
    var currentPay = tx.payment_method || '現金';
    var payOptionsHTML = '';
    allPayments.forEach(function (pm) {
      var sel = pm === currentPay ? 'selected' : '';
      payOptionsHTML += '<option value="' + $s.escapeHtml(pm) + '" ' + sel + '>' + $s.escapeHtml(pm) + '</option>';
    });
    payOptionsHTML += '<option value="' + $s.ADD_NEW_VALUE + '" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>';

    body.innerHTML =
      '<div class="modal-field">' +
        '<span class="modal-field-label">原始語音內容</span>' +
        '<div class="modal-transcript">' + (tx.transcript || '無原始語音紀錄') + '</div>' +
      '</div>' +
      '<div class="modal-field-row">' +
        '<div class="modal-field">' +
          '<span class="modal-field-label">類別</span>' +
          '<select id="modal-category" onchange="VoiceFinance.handleModalCatChange(this)">' + catOptions + '</select>' +
        '</div>' +
        '<div class="modal-field">' +
          '<span class="modal-field-label">金額</span>' +
          '<input type="text" id="modal-amount" value="' + tx.amount.toLocaleString() + '" oninput="VoiceFinance.formatAmountInput(this)">' +
        '</div>' +
      '</div>' +
      '<div class="modal-field" id="modal-sub-cat-field">' +
        '<span class="modal-field-label">子分類</span>' +
        '<div class="sub-cat-pills-row" id="modal-sub-cat-pills">' +
          subCatPillsHTML +
        '</div>' +
        '<input type="hidden" id="modal-sub-category" value="' + currentSub + '">' +
      '</div>' +
      '<div class="modal-field-row">' +
        '<div class="modal-field">' +
          '<span class="modal-field-label">帳戶/工具</span>' +
          '<select id="modal-payment" onchange="VoiceFinance.handleModalPayChange(this)">' + payOptionsHTML + '</select>' +
        '</div>' +
        '<div class="modal-field">' +
          '<span class="modal-field-label">商家名稱</span>' +
          '<input type="text" id="modal-merchant" value="' + (tx.merchant || '') + '">' +
        '</div>' +
      '</div>' +
      '<div class="modal-field">' +
        '<span class="modal-field-label">商品細項（逗號分隔）</span>' +
        '<input type="text" id="modal-items" value="' + ((tx.items || []).join('、')) + '">' +
      '</div>' +
      '<div class="modal-field-row">' +
        '<div class="modal-field">' +
          '<span class="modal-field-label">日期</span>' +
          '<input type="date" id="modal-date" value="' + tx.date + '">' +
        '</div>' +
        '<div class="modal-field">' +
          '<span class="modal-field-label">類型</span>' +
          '<select id="modal-type">' +
            '<option value="expense" ' + (tx.type === 'expense' ? 'selected' : '') + '>支出</option>' +
            '<option value="income" ' + (tx.type === 'income' ? 'selected' : '') + '>收入</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
      '<div class="modal-field">' +
        '<span class="modal-field-label">描述</span>' +
        '<input type="text" id="modal-description" value="' + (tx.description || '') + '">' +
      '</div>';
  }

  function updateModalSubPills(newCategory) {
    var pillRow = document.getElementById('modal-sub-cat-pills');
    var l2List = $s.getSubCategories(newCategory);
    if (!l2List.includes('其他')) l2List.push('其他');
    var html = '';
    l2List.forEach(function (l2) {
      var active = l2 === l2List[0] ? ' active' : '';
      html += '<span class="sub-cat-pill' + active + '" onclick="this.parentElement.querySelectorAll(\'.sub-cat-pill\').forEach(function(p){p.classList.remove(\'active\')}); this.classList.add(\'active\'); document.getElementById(\'modal-sub-category\').value=\'' + l2 + '\'">' + l2 + '</span>';
    });
    pillRow.innerHTML = html;
    document.getElementById('modal-sub-category').value = l2List[0];
  }

  VoiceFinance.handleModalCatChange = function (selectEl) {
    if (selectEl.value === $s.ADD_NEW_VALUE) {
      $s.showInlineAddPrompt(selectEl, 'categories', null, function (newVal) {
        updateModalSubPills(newVal);
        document.getElementById('modal-category').value = newVal;
      });
    } else {
      updateModalSubPills(selectEl.value);
    }
  };

  VoiceFinance.handleModalPayChange = function (selectEl) {
    if (selectEl.value === $s.ADD_NEW_VALUE) {
      $s.showInlineAddPrompt(selectEl, 'accounts', null, function (newVal) {
        selectEl.value = newVal;
      });
    }
  };

  function saveModalChanges() {
    var tx = st.transactions.find(function (t) { return t.id === st.currentModalTxId; });
    if (!tx) return;

    tx.category = document.getElementById('modal-category').value;
    tx.sub_category = document.getElementById('modal-sub-category').value || '其他';
    tx.amount = parseInt(document.getElementById('modal-amount').value.replace(/,/g, '')) || 0;
    tx.payment_method = document.getElementById('modal-payment').value;
    tx.merchant = document.getElementById('modal-merchant').value;
    tx.description = document.getElementById('modal-description').value;
    tx.date = document.getElementById('modal-date').value;
    tx.type = document.getElementById('modal-type').value;

    var itemsRaw = document.getElementById('modal-items').value.trim();
    tx.items = itemsRaw ? itemsRaw.split(/[,、,\s]+/).map(function (s) { return s.trim(); }).filter(Boolean) : [];

    $s.saveTransactionsToStorage();
    updateDashboard();
    patchTransaction(st.currentModalTxId, {
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
    if (!st.currentModalTxId) return;
    st.transactions = st.transactions.filter(function (t) { return t.id !== st.currentModalTxId; });
    $s.saveTransactionsToStorage();
    updateDashboard();
    closeTransactionModal();
  }

  // ======================================================================
  // QR Scanner
  // ======================================================================
  function openQrScanner() {
    var overlay = document.getElementById('scanner-modal-overlay');
    overlay.classList.add('active');

    var resultEl = document.getElementById('qr-scan-result');
    resultEl.style.display = 'none';
    resultEl.innerText = '';

    if (!window.Html5Qrcode) {
      resultEl.style.display = '';
      resultEl.style.color = '#FF4D4D';
      resultEl.innerText = 'QR 掃描庫載入失敗，請檢查網路連線。';
      return;
    }

    if (st.html5QrcodeScanner) {
      st.html5QrcodeScanner.clear().catch(function () {});
    }

    st.html5QrcodeScanner = new Html5Qrcode('qr-reader');

    var config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    st.html5QrcodeScanner.start(
      { facingMode: 'environment' },
      config,
      onQrScanSuccess,
      onQrScanError
    ).catch(function (err) {
      resultEl.style.display = '';
      resultEl.style.color = '#FFD700';
      resultEl.innerText = '無法啟動相機，請確認已允許相機權限。您也可以手動貼上 QR Code 字串。';

      var manualInput = document.createElement('div');
      manualInput.style.cssText = 'margin-top:10px;display:flex;gap:8px;';
      manualInput.innerHTML =
        '<input type="text" id="manual-qr-input" placeholder="貼上發票 QR Code 左側字串..." ' +
        'style="flex:1;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;color:white;font-size:13px;outline:none;">' +
        '<button id="btn-manual-qr-submit" class="btn btn-primary" style="padding:8px 14px;font-size:12px;">提交</button>';
      resultEl.parentNode.appendChild(manualInput);

      document.getElementById('btn-manual-qr-submit').addEventListener('click', function () {
        var qrString = document.getElementById('manual-qr-input').value.trim();
        if (qrString) processQrString(qrString);
      });
    });
  }

  function onQrScanSuccess(decodedText) {
    if (st.html5QrcodeScanner) {
      st.html5QrcodeScanner.stop().catch(function () {});
      st.html5QrcodeScanner = null;
    }
    processQrString(decodedText);
  }

  function onQrScanError() {}

  async function processQrString(qrString) {
    var resultEl = document.getElementById('qr-scan-result');
    resultEl.style.display = '';
    resultEl.style.color = '';
    resultEl.innerText = '⏳ 正在解析發票 QR Code...';

    try {
      var response = await fetch('/api/parse-invoice-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_string: qrString })
      });

      if (response.ok) {
        var data = await response.json();
        var newTx = {
          id: Date.now().toString(),
          date: data.date,
          type: data.type || 'expense',
          amount: parseFloat(data.amount) || 0,
          category: data.category || '日常用品',
          sub_category: data.sub_category || '其他',
          description: data.description || '電子發票',
          payment_method: data.payment_method || '載具',
          merchant: data.merchant || '電子發票',
          transcript: '[掃描發票] ' + (data.description || ''),
          items: data.items || []
        };

        st.transactions.unshift(newTx);
        syncAccountBalance(newTx.payment_method, newTx.amount, newTx.type);
        $s.saveTransactionsToStorage();
        updateDashboard();

        resultEl.style.color = '#00E676';
        resultEl.innerText = '✅ 發票已入帳！金額: $' + newTx.amount.toLocaleString();

        var quotes = $a.quotes.onInvoiceScanned;
        $a.triggerCustom(quotes[Math.floor(Math.random() * quotes.length)]);

        setTimeout(closeQrScanner, 1500);
      } else {
        var err = await response.text();
        resultEl.style.color = '#FF4D4D';
        resultEl.innerText = '❌ 發票解析失敗: ' + err;
      }
    } catch (error) {
      resultEl.style.color = '#FF4D4D';
      resultEl.innerText = '❌ 連線失敗: ' + error.message;
    }
  }

  function closeQrScanner() {
    if (st.html5QrcodeScanner) {
      st.html5QrcodeScanner.stop().catch(function () {});
      st.html5QrcodeScanner.clear().catch(function () {});
      st.html5QrcodeScanner = null;
    }
    document.getElementById('scanner-modal-overlay').classList.remove('active');
    var manualInput = document.getElementById('manual-qr-input');
    if (manualInput) manualInput.parentNode.remove();
  }

  // ======================================================================
  // Carrier Binding
  // ======================================================================
  function saveCarrierBinding() {
    var barcode = document.getElementById('carrier-barcode').value.trim();
    var pin = document.getElementById('carrier-pin').value.trim();

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

    st.carrierBarcode = barcode;
    st.carrierPin = pin;

    localStorage.setItem('voice_finance_carrier', JSON.stringify({
      barcode: st.carrierBarcode,
      pin: st.carrierPin
    }));

    document.getElementById('carrier-status').innerText = '✅ 載具已綁定';
    document.getElementById('carrier-status').style.color = '#00E676';

    $a.triggerCustom('主人！發票已經自動匯入囉！✨');
  }

  function clearCarrierBinding() {
    st.carrierBarcode = '';
    st.carrierPin = '';
    localStorage.removeItem('voice_finance_carrier');
    document.getElementById('carrier-barcode').value = '';
    document.getElementById('carrier-pin').value = '';
    document.getElementById('carrier-status').innerText = '';
  }

  function loadCarrierFromStorage() {
    var stored = localStorage.getItem('voice_finance_carrier');
    if (stored) {
      try {
        var data = JSON.parse(stored);
        st.carrierBarcode = data.barcode || '';
        st.carrierPin = data.pin || '';
        if (st.carrierBarcode) {
          document.getElementById('carrier-barcode').value = st.carrierBarcode;
        }
        if (st.carrierPin) {
          document.getElementById('carrier-pin').value = st.carrierPin;
        }
        if (st.carrierBarcode && st.carrierPin) {
          document.getElementById('carrier-status').innerText = '✅ 載具已綁定';
          document.getElementById('carrier-status').style.color = '#00E676';
        }
      } catch (e) {
        console.error('Failed to parse carrier data', e);
      }
    }
  }

  // ======================================================================
  // Manual Entry Modal
  // ======================================================================
  function openManualEntryModal() {
    st.manualEntryType = 'expense';
    setManualTypeUI('expense');

    document.getElementById('manual-amount').value = '';
    document.getElementById('manual-description').value = '';

    $s.renderSelectWithAdd('manual-payment', 'accounts', null, '現金', function () {});
    $s.renderSelectWithAdd('manual-category', 'categories', null, '餐飲食品', function () {
      updateManualSubCategory();
    });
    renderAccountSelect('manual-from-account', '現金');
    renderAccountSelect('manual-to-account', '');

    updateManualSubCategory();
    showManualFields();

    document.getElementById('manual-entry-overlay').classList.add('active');
    setTimeout(function () { document.getElementById('manual-amount').focus(); }, 100);
  }

  function renderAccountSelect(selectId, defaultVal) {
    var sel = document.getElementById(selectId);
    sel.innerHTML = '';
    st.bankAccounts.forEach(function (a) {
      var selAttr = a.name === defaultVal ? ' selected' : '';
      sel.innerHTML += '<option value="' + $s.escapeHtml(a.name) + '"' + selAttr + '>' + $s.escapeHtml(a.name) + ' ($' + a.balance.toLocaleString() + ')</option>';
    });
  }

  function closeManualEntryModal() {
    document.getElementById('manual-entry-overlay').classList.remove('active');
  }

  VoiceFinance.setManualType = function (type) {
    st.manualEntryType = type;
    setManualTypeUI(type);
    showManualFields();
  };

  function setManualTypeUI(type) {
    document.getElementById('manual-type-tabs').querySelectorAll('.manual-type-tab').forEach(function (t) { t.classList.remove('active'); });
    var tab = document.querySelector('.manual-type-tab[data-type="' + type + '"]');
    if (tab) tab.classList.add('active');
  }

  function showManualFields() {
    var isTransfer = st.manualEntryType === 'transfer';
    document.getElementById('manual-payment-field').style.display = isTransfer ? 'none' : '';
    document.getElementById('manual-transfer-fields').style.display = isTransfer ? '' : 'none';
    document.getElementById('manual-category-fields').style.display = isTransfer ? 'none' : '';
  }

  VoiceFinance.updateManualSubCategory = updateManualSubCategory;
  function updateManualSubCategory() {
    var catSelect = document.getElementById('manual-category');
    var cat = catSelect.value;
    if (cat === $s.ADD_NEW_VALUE) return;
    var l2List = $s.getSubCategories(cat);
    if (!l2List.includes('其他')) l2List.push('其他');
    var subSelect = document.getElementById('manual-sub-category');
    subSelect.innerHTML = '';
    l2List.forEach(function (l2) {
      subSelect.innerHTML += '<option value="' + l2 + '">' + l2 + '</option>';
    });
    subSelect.innerHTML += '<option value="' + $s.ADD_NEW_VALUE + '" style="color:var(--accent-cyan);font-style:italic;">+ 新增自訂項目</option>';

    var handler = function () {
      if (this.value === $s.ADD_NEW_VALUE) {
        $s.showInlineAddPrompt(this, 'sub', cat, function (newVal) {
          VoiceFinance.updateManualSubCategory();
          this.value = newVal;
        }.bind(this));
      }
    };
    subSelect.removeEventListener('change', subSelect._dynHandler);
    subSelect._dynHandler = handler;
    subSelect.addEventListener('change', handler);
  }

  function submitManualEntry() {
    var rawVal = document.getElementById('manual-amount').value.replace(/,/g, '');
    var amountVal = parseFloat(rawVal);
    if (!amountVal || amountVal <= 0) {
      $a.triggerCustom('主人～金額好像還沒填對喔！請確認一下再按確認記帳～🧐');
      return;
    }

    var today = $s.getFormattedDate(0);

    if (st.manualEntryType === 'transfer') {
      var fromAcc = document.getElementById('manual-from-account').value;
      var toAcc = document.getElementById('manual-to-account').value;
      if (!fromAcc || !toAcc) {
        $a.triggerCustom('主人～請選擇來源和目的帳戶才能轉帳喔！🧐');
        return;
      }
      if (fromAcc === toAcc) {
        $a.triggerCustom('主人～來源和目的帳戶不能一樣啦！😅');
        return;
      }

      var fromObj = st.bankAccounts.find(function (a) { return a.name === fromAcc; });
      if (fromObj && fromObj.balance < amountVal) {
        $a.triggerCustom('主人～來源帳戶餘額不足，無法完成轉帳！💸');
        return;
      }

      if (fromObj) { fromObj.balance -= amountVal; }
      var toObj = st.bankAccounts.find(function (a) { return a.name === toAcc; });
      if (toObj) { toObj.balance += amountVal; }
      saveAccountsToStorage();
      renderAccountsPanel();

      st.transactions.unshift({
        id: Date.now().toString(), date: today, type: 'transfer',
        amount: amountVal, category: '其他', sub_category: '其他',
        description: document.getElementById('manual-description').value.trim() || '轉帳',
        payment_method: fromAcc + ' → ' + toAcc,
        merchant: '轉帳', transcript: '[轉帳] ' + fromAcc + ' → ' + toAcc + ' $' + amountVal.toLocaleString(),
        items: []
      });
      $s.saveTransactionsToStorage();
      updateDashboard();
      $a.triggerCustom('轉帳成功！主人～資金已經安全送達目的帳戶囉！🔄');

      document.getElementById('manual-from-account').value = '';
      document.getElementById('manual-to-account').value = '';
    } else {
      var newTx = {
        id: Date.now().toString(), date: today, type: st.manualEntryType,
        amount: amountVal,
        category: document.getElementById('manual-category').value || '其他',
        sub_category: document.getElementById('manual-sub-category').value || '其他',
        description: document.getElementById('manual-description').value.trim() || '手動記帳',
        payment_method: document.getElementById('manual-payment').value || '現金',
        merchant: '手動輸入',
        transcript: '[手動記帳] ' + (document.getElementById('manual-description').value.trim() || '手動記帳'),
        items: []
      };
      st.transactions.unshift(newTx);
      syncAccountBalance(newTx.payment_method, newTx.amount, newTx.type);
      $s.saveTransactionsToStorage();
      updateDashboard();
      var quotes = $a.quotes.onManualEntry;
      $a.triggerCustom(quotes[Math.floor(Math.random() * quotes.length)]);
    }

    closeManualEntryModal();
  }

  // ======================================================================
  // Amount Input Formatter
  // ======================================================================
  VoiceFinance.formatAmountInput = function (input) {
    var cursorPos = input.selectionStart;
    var raw = input.value.replace(/,/g, '');
    if (raw === '' || isNaN(raw)) { input.value = raw; return; }
    var beforeLen = input.value.length;
    input.value = parseInt(raw, 10).toLocaleString();
    var diff = input.value.length - beforeLen;
    input.selectionStart = input.selectionEnd = cursorPos + diff;
  };

  // ======================================================================
  // VoiceFinance.setInputText (helper exposed for HTML hints)
  // ======================================================================
  VoiceFinance.setInputText = function (text) {
    document.getElementById('manual-text-input').value = text;
    document.getElementById('manual-text-input').focus();
  };

  // ======================================================================
  // Bank Account Management
  // ======================================================================
  function loadAccountsFromStorage() {
    var stored = localStorage.getItem('voice_finance_bank_accounts');
    if (stored) { try { st.bankAccounts = JSON.parse(stored); } catch (e) { st.bankAccounts = []; } }
  }

  function saveAccountsToStorage() {
    localStorage.setItem('voice_finance_bank_accounts', JSON.stringify(st.bankAccounts));
  }

  function renderAccountsPanel() {
    var listEl = document.getElementById('accounts-list');
    var emptyEl = document.getElementById('accounts-empty');
    listEl.innerHTML = '';
    if (st.bankAccounts.length === 0) { emptyEl.classList.add('active'); return; }
    emptyEl.classList.remove('active');
    st.bankAccounts.forEach(function (acc) {
      var typeIcon = acc.type === 'bank' ? 'account_balance' : acc.type === 'wallet' ? 'wallet' : 'savings';
      var row = document.createElement('div');
      row.className = 'account-row';
      row.innerHTML =
        '<div class="account-info">' +
          '<span class="material-icons-round account-type-icon">' + typeIcon + '</span>' +
          '<div>' +
            '<span class="account-name">' + $s.escapeHtml(acc.name) + '</span>' +
            '<span class="account-type-badge">' + (acc.type === 'bank' ? '銀行' : acc.type === 'wallet' ? '錢包' : '現金') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="account-balance">' +
          '<span class="balance-value" ondblclick="VoiceFinance.editAccountBalance(\'' + acc.id + '\')" title="雙擊編輯餘額">$' + acc.balance.toLocaleString() + '</span>' +
          '<button class="delete-action-btn" onclick="VoiceFinance.deleteAccount(\'' + acc.id + '\')"><span class="material-icons-round">delete_outline</span></button>' +
        '</div>';
      listEl.appendChild(row);
    });
    if (st.isPrivacyMode) applyPrivacyMask();
  }

  function addAccount() {
    var name = prompt('請輸入帳戶名稱（例如：國泰世華）：');
    if (!name || !name.trim()) return;
    var type = prompt('請輸入帳戶類型（bank/cash/wallet）：', 'bank');
    if (!type) return;
    var balance = parseFloat(prompt('請輸入目前餘額：', '0'));
    st.bankAccounts.push({ id: Date.now().toString(), name: name.trim(), type: type.trim() || 'bank', balance: isNaN(balance) ? 0 : balance });
    saveAccountsToStorage();
    renderAccountsPanel();
    updateDashboard();
  }

  VoiceFinance.deleteAccount = function (id) {
    if (confirm('確定要刪除此帳戶嗎？')) {
      st.bankAccounts = st.bankAccounts.filter(function (a) { return a.id !== id; });
      saveAccountsToStorage();
      renderAccountsPanel();
      updateDashboard();
    }
  };

  VoiceFinance.editAccountBalance = function (id) {
    var acc = st.bankAccounts.find(function (a) { return a.id === id; });
    if (!acc) return;
    var newBalance = prompt('編輯 ' + acc.name + ' 的餘額：', acc.balance);
    if (newBalance === null) return;
    var val = parseFloat(newBalance);
    if (!isNaN(val)) { acc.balance = val; saveAccountsToStorage(); renderAccountsPanel(); updateDashboard(); }
  };

  function syncAccountBalance(paymentMethod, amount, txType) {
    var acc = st.bankAccounts.find(function (a) { return a.name === paymentMethod; });
    if (!acc) return;
    if (txType === 'expense') { acc.balance -= amount; } else { acc.balance += amount; }
    saveAccountsToStorage();
    renderAccountsPanel();
  }

  // ======================================================================
  // Loan Management
  // ======================================================================
  function loadLoansFromStorage() {
    var stored = localStorage.getItem('voice_finance_loans');
    if (stored) { try { st.loans = JSON.parse(stored); } catch (e) { st.loans = []; } }
  }

  function saveLoansToStorage() {
    localStorage.setItem('voice_finance_loans', JSON.stringify(st.loans));
  }

  function renderLoansPanel() {
    var listEl = document.getElementById('loans-list');
    var emptyEl = document.getElementById('loans-empty');
    listEl.innerHTML = '';
    if (st.loans.length === 0) { emptyEl.classList.add('active'); return; }
    emptyEl.classList.remove('active');
    st.loans.forEach(function (loan) {
      var repaidPercent = loan.totalPrincipal > 0 ? Math.round(((loan.totalPrincipal - loan.remainingBalance) / loan.totalPrincipal) * 100) : 0;
      var row = document.createElement('div');
      row.className = 'loan-row';
      var repaidBtn = loan.remainingBalance > 0 ?
        '<button class="btn btn-success" style="padding:4px 10px;font-size:11px;margin-top:8px;" onclick="VoiceFinance.makeLoanRepayment(\'' + loan.id + '\')"><span class="material-icons-round" style="font-size:13px;">payments</span> 記錄還款</button>' :
        '<span style="color:var(--color-income);font-size:11px;"> 已全額還清</span>';
      row.innerHTML =
        '<div class="loan-header">' +
          '<span class="loan-name">' + $s.escapeHtml(loan.name) + '</span>' +
          '<span class="loan-due">下期: ' + (loan.nextDueDate || '---') + '</span>' +
          '<button class="delete-action-btn" onclick="VoiceFinance.deleteLoan(\'' + loan.id + '\')"><span class="material-icons-round">delete_outline</span></button>' +
        '</div>' +
        '<div class="loan-bar-wrapper">' +
          '<div class="loan-bar-track"><div class="loan-bar-fill" style="width:' + repaidPercent + '%;"></div></div>' +
          '<span class="loan-bar-label">' + repaidPercent + '% 已還</span>' +
        '</div>' +
        '<div class="loan-details">' +
          '<span>總額: $' + loan.totalPrincipal.toLocaleString() + '</span>' +
          '<span>剩餘: $' + loan.remainingBalance.toLocaleString() + '</span>' +
          '<span>月付: $' + loan.monthlyPayment.toLocaleString() + '</span>' +
        '</div>' + repaidBtn;
      listEl.appendChild(row);
    });
    if (st.isPrivacyMode) applyPrivacyMask();
  }

  function addLoan() {
    var name = prompt('請輸入貸款名稱：');
    if (!name || !name.trim()) return;
    var total = parseFloat(prompt('貸款總額：', '0'));
    if (isNaN(total) || total <= 0) return;
    var remaining = parseFloat(prompt('剩餘本金：', total.toString()));
    var monthly = parseFloat(prompt('每月還款金額：', '0'));
    var due = prompt('下次還款日期 (YYYY-MM-DD)：', new Date().toISOString().split('T')[0]);
    st.loans.push({ id: Date.now().toString(), name: name.trim(), totalPrincipal: total, remainingBalance: isNaN(remaining) ? total : remaining, monthlyPayment: isNaN(monthly) ? 0 : monthly, nextDueDate: due || '' });
    saveLoansToStorage();
    renderLoansPanel();
  }

  VoiceFinance.deleteLoan = function (id) {
    if (confirm('確定要刪除此貸款項目嗎？')) {
      st.loans = st.loans.filter(function (l) { return l.id !== id; });
      saveLoansToStorage();
      renderLoansPanel();
    }
  };

  VoiceFinance.makeLoanRepayment = function (id) {
    var loan = st.loans.find(function (l) { return l.id === id; });
    if (!loan || loan.remainingBalance <= 0) return;
    var amount = Math.min(loan.monthlyPayment, loan.remainingBalance);
    loan.remainingBalance = Math.max(0, loan.remainingBalance - amount);
    var dueDate = new Date(loan.nextDueDate);
    if (!isNaN(dueDate.getTime())) { dueDate.setMonth(dueDate.getMonth() + 1); loan.nextDueDate = dueDate.toISOString().split('T')[0]; }
    saveLoansToStorage();
    renderLoansPanel();
    var today = $s.getFormattedDate(0);
    st.transactions.unshift({ id: Date.now().toString(), date: today, type: 'expense', amount: amount, category: '居家', sub_category: '其他', description: loan.name + ' 還款', payment_method: '銀行轉帳', merchant: loan.name, transcript: '[貸款還款] ' + loan.name + ' $' + amount, items: [] });
    $s.saveTransactionsToStorage();
    updateDashboard();
    var quotes = $a.quotes.onLoanRepayment;
    $a.triggerCustom(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  function checkAutoRepayments() {
    var today = $s.getFormattedDate(0);
    var didRepay = false;
    st.loans.forEach(function (loan) {
      if (loan.nextDueDate && loan.nextDueDate <= today && loan.remainingBalance > 0) {
        var amount = Math.min(loan.monthlyPayment, loan.remainingBalance);
        loan.remainingBalance = Math.max(0, loan.remainingBalance - amount);
        var dueDate = new Date(loan.nextDueDate);
        if (!isNaN(dueDate.getTime())) { dueDate.setMonth(dueDate.getMonth() + 1); loan.nextDueDate = dueDate.toISOString().split('T')[0]; }
        st.transactions.unshift({ id: Date.now().toString(), date: today, type: 'expense', amount: amount, category: '居家', sub_category: '其他', description: loan.name + ' 自動還款', payment_method: '銀行轉帳', merchant: loan.name, transcript: '[自動還款] ' + loan.name + ' $' + amount, items: [] });
        didRepay = true;
      }
    });
    if (didRepay) {
      saveLoansToStorage();
      $s.saveTransactionsToStorage();
      updateDashboard();
      renderLoansPanel();
      var quotes = $a.quotes.onLoanRepayment;
      $a.triggerCustom(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }

  function checkRecurringWarnings() {
    var now = new Date();

    var monthlyRecurring = st.transactions.filter(function (t) {
      if (!t.isRecurring) return false;
      var start = new Date(t.startDate + 'T00:00:00');
      var end = t.endDate ? new Date(t.endDate + 'T00:00:00') : null;
      if (now < start) return false;
      if (end && now > end) return false;
      return true;
    });

    if (monthlyRecurring.length === 0) return;

    var monthlyTotal = monthlyRecurring.reduce(function (sum, t) { return sum + t.amount; }, 0);
    var recurringNames = monthlyRecurring.map(function (t) {
      return t.description || t.category;
    }).filter(function (v, i, a) { return a.indexOf(v) === i; });

    var quotes = $a.quotes.onProactiveBudget;
    var quote = quotes[Math.floor(Math.random() * quotes.length)];
    quote = quote.replace('$RECURRING_AMOUNT', '$' + monthlyTotal.toLocaleString());

    if (recurringNames.length > 0 && recurringNames.length <= 3) {
      quote = quote.replace('固定貸款與排程費用', recurringNames.join('、'));
    }

    setTimeout(function () {
      $a.triggerCustom(quote);
    }, 2500);
  }

  // ======================================================================
  // Web Speech API Integration
  // ======================================================================
  function initSpeechRecognition() {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      document.getElementById('mic-status').innerText = '您的瀏覽器不支援 Web Speech 語音識別。您可以點擊下方氣泡或手動輸入文字進行測試。';
      document.getElementById('mic-btn').disabled = true;
      document.getElementById('mic-btn').style.opacity = '0.5';
      return;
    }

    st.recognition = new SpeechRecognition();
    st.recognition.continuous = false;
    st.recognition.lang = 'zh-TW';
    st.recognition.interimResults = true;

    st.recognition.onstart = function () {
      st.isRecording = true;
      updateMicButtonState();
      document.getElementById('mic-status').innerText = '正在錄音中...請大聲說話';
      document.getElementById('transcript-text').innerText = '聽取中...';
      document.getElementById('transcript-text').classList.remove('transcript-placeholder');
    };

    st.recognition.onresult = function (event) {
      var interimTranscript = '';
      var finalTranscript = '';

      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      var displayResult = finalTranscript || interimTranscript;
      if (displayResult) {
        document.getElementById('transcript-text').innerText = displayResult;
      }
    };

    st.recognition.onerror = function (event) {
      console.error('Speech recognition error', event);
      st.isRecording = false;
      updateMicButtonState();
      document.getElementById('mic-status').innerText = '辨識出錯: ' + event.error;
    };

    st.recognition.onend = function () {
      if (st.isRecording) {
        st.isRecording = false;
        updateMicButtonState();
        document.getElementById('mic-status').innerText = '錄音結束';

        var recognizedText = document.getElementById('transcript-text').innerText;
        if (recognizedText && recognizedText !== '聽取中...' && recognizedText.trim().length > 0) {
          showTranscriptActions();
        } else {
          document.getElementById('mic-status').innerText = '未偵測到語音內容，請重試。';
        }
      }
    };
  }

  function updateMicButtonState() {
    var micBtn = document.getElementById('mic-btn');
    if (st.isRecording) {
      micBtn.classList.add('recording');
    } else {
      micBtn.classList.remove('recording');
    }
  }

  // ======================================================================
  // Event Binding
  // ======================================================================
  function bindUIEvents() {
    var micBtn = document.getElementById('mic-btn');
    if (micBtn && st.recognition) {
      micBtn.addEventListener('click', function () {
        if (st.isRecording) {
          st.recognition.stop();
        } else {
          st.recognition.start();
        }
      });
    }

    var parseBtn = document.getElementById('parse-text-btn');
    if (parseBtn) {
      parseBtn.addEventListener('click', function () {
        var textInput = document.getElementById('manual-text-input').value.trim();
        if (textInput) {
          parseVoiceTransaction(textInput);
          document.getElementById('manual-text-input').value = '';
        }
      });
    }

    document.getElementById('manual-text-input').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        document.getElementById('parse-text-btn').click();
      }
    });

    document.getElementById('btn-edit-transcript').addEventListener('click', function () { toggleEditMode(); });
    document.getElementById('btn-confirm-write').addEventListener('click', function () { commitTranscript(); });
    document.getElementById('btn-cancel-reset').addEventListener('click', function () { resetTranscript(); });

    document.querySelectorAll('.period-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        document.querySelectorAll('.period-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        st.activePeriod = pill.dataset.period;
        updateDashboard();
        if (st.activePeriod === 'month') {
          checkRecurringWarnings();
        }
        $a.triggerQuote('onPeriodToggled');
      });
    });

    document.getElementById('anime-character').addEventListener('click', function () {
      $a.triggerQuote('onIdle');
    });

    document.getElementById('recurring-end-type').addEventListener('change', function (e) {
      document.getElementById('recurring-end-date-field').style.display = e.target.value === 'custom' ? '' : 'none';
    });
    document.getElementById('btn-confirm-recurring').addEventListener('click', confirmRecurringTransaction);
    document.getElementById('btn-cancel-recurring').addEventListener('click', cancelRecurringTransaction);

    document.getElementById('modal-close-btn').addEventListener('click', closeTransactionModal);
    document.getElementById('modal-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) closeTransactionModal();
    });
    document.getElementById('modal-save-btn').addEventListener('click', saveModalChanges);
    document.getElementById('modal-delete-btn').addEventListener('click', deleteFromModal);

    document.getElementById('btn-scan-invoice').addEventListener('click', openQrScanner);
    document.getElementById('scanner-modal-close-btn').addEventListener('click', closeQrScanner);
    document.getElementById('scanner-modal-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) closeQrScanner();
    });

    document.getElementById('btn-save-carrier').addEventListener('click', saveCarrierBinding);
    document.getElementById('btn-clear-carrier').addEventListener('click', clearCarrierBinding);

    document.getElementById('btn-manual-entry').addEventListener('click', openManualEntryModal);
    document.getElementById('manual-entry-close-btn').addEventListener('click', closeManualEntryModal);
    document.getElementById('manual-entry-overlay').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) closeManualEntryModal();
    });
    document.getElementById('btn-submit-manual').addEventListener('click', submitManualEntry);

    document.getElementById('btn-add-account').addEventListener('click', addAccount);
    document.getElementById('btn-add-loan').addEventListener('click', addLoan);

    var privacyBtn = document.getElementById('privacy-toggle-btn');
    if (privacyBtn) {
      privacyBtn.addEventListener('click', togglePrivacyMode);
    }

    var csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', $s.exportCSV);
    }

    var backupBtn = document.getElementById('btn-export-backup');
    if (backupBtn) {
      backupBtn.addEventListener('click', $s.exportJSONBackup);
    }

    var restoreBtn = document.getElementById('btn-import-backup');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', $s.importJSONBackup);
    }

    loadCarrierFromStorage();
  }

  // ======================================================================
  // Initialization
  // ======================================================================
  document.addEventListener('DOMContentLoaded', function () {
    $s.loadTransactionsFromStorage();
    loadAccountsFromStorage();
    loadLoansFromStorage();
    initSpeechRecognition();
    bindUIEvents();
    updateDashboard();
    renderAccountsPanel();
    renderLoansPanel();
    checkAutoRepayments();
    checkRecurringWarnings();
  });
})();
