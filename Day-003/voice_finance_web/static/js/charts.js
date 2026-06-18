// ==========================================================================
// VoiceFinance.charts — SVG Doughnut Pie & Dual-Bar Chart Renderer
// ==========================================================================
(function () {
  window.VoiceFinance = window.VoiceFinance || {};

  var categoryColors = {
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

  var categoryIcons = {
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

  function renderCategoryPieChart(totalExpense, expenses) {
    var svg = document.getElementById('pie-chart-svg');
    var legendContainer = document.getElementById('chart-legend-container');
    document.getElementById('chart-total-value').innerText = '$' + totalExpense.toLocaleString();

    var paths = svg.querySelectorAll('.chart-slice');
    paths.forEach(function (p) { p.remove(); });
    legendContainer.innerHTML = '';

    if (totalExpense === 0) {
      legendContainer.innerHTML = '<div style="color: var(--text-muted); font-size:13px; text-align:center;">目前無支出數據可供統計</div>';
      return;
    }

    var catTotals = {};
    expenses.forEach(function (e) {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });

    var sortedCats = Object.entries(catTotals).sort(function (a, b) { return b[1] - a[1]; });

    var accumulatedAngle = 0;

    sortedCats.forEach(function (entry) {
      var category = entry[0];
      var amount = entry[1];
      var percentage = amount / totalExpense;
      var color = categoryColors[category] || '#8395a7';

      var circumference = 439.82;
      var strokeLength = percentage * circumference;
      var strokeOffset = -accumulatedAngle;

      var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '100');
      circle.setAttribute('cy', '100');
      circle.setAttribute('r', '70');
      circle.setAttribute('class', 'chart-slice');
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '20');
      circle.setAttribute('stroke-dasharray', strokeLength + ' ' + circumference);
      circle.setAttribute('stroke-dashoffset', strokeOffset.toString());
      circle.setAttribute('stroke-linecap', percentage === 1 ? 'butt' : 'round');

      svg.appendChild(circle);

      accumulatedAngle += strokeLength;

      var legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML =
        '<div class="legend-left">' +
          '<span class="legend-color-dot" style="background-color: ' + color + ';"></span>' +
          '<span class="legend-name">' + category + ' (' + (percentage * 100).toFixed(1) + '%)</span>' +
        '</div>' +
        '<span class="legend-value">$' + amount.toLocaleString() + '</span>';
      legendContainer.appendChild(legendItem);
    });
  }

  function createBarValueText(x, y, amount) {
    var vt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    vt.setAttribute('x', x);
    vt.setAttribute('y', y);
    vt.setAttribute('class', 'bar-chart-value-text');
    vt.setAttribute('text-anchor', 'middle');
    var fmtVal = amount >= 1000 ? ((amount / 1000).toFixed(1).replace('.0', '') + 'k') : amount;
    vt.textContent = fmtVal;
    return vt;
  }

  function ensureBarGradients(svg) {
    if (svg.querySelector('#bar-expense-gradient')) return;
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    var gIncome = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gIncome.setAttribute('id', 'bar-income-gradient');
    gIncome.setAttribute('x1', '0'); gIncome.setAttribute('x2', '0');
    gIncome.setAttribute('y1', '0'); gIncome.setAttribute('y2', '1');
    gIncome.innerHTML = '<stop offset="0%" stop-color="#00E676" stop-opacity="0.95"/><stop offset="100%" stop-color="#00B0FF" stop-opacity="0.5"/>';
    defs.appendChild(gIncome);

    var gExpense = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gExpense.setAttribute('id', 'bar-expense-gradient');
    gExpense.setAttribute('x1', '0'); gExpense.setAttribute('x2', '0');
    gExpense.setAttribute('y1', '0'); gExpense.setAttribute('y2', '1');
    gExpense.innerHTML = '<stop offset="0%" stop-color="#00F2FE" stop-opacity="0.9"/><stop offset="100%" stop-color="#4FACFE" stop-opacity="0.5"/>';
    defs.appendChild(gExpense);

    var gExpenseActive = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gExpenseActive.setAttribute('id', 'bar-expense-gradient-active');
    gExpenseActive.setAttribute('x1', '0'); gExpenseActive.setAttribute('x2', '0');
    gExpenseActive.setAttribute('y1', '0'); gExpenseActive.setAttribute('y2', '1');
    gExpenseActive.innerHTML = '<stop offset="0%" stop-color="#00F2FE" stop-opacity="1"/><stop offset="100%" stop-color="#0072FF" stop-opacity="0.8"/>';
    defs.appendChild(gExpenseActive);

    svg.insertBefore(defs, svg.firstChild);
  }

  function renderBarChart(displayTx) {
    var pieVisual = document.getElementById('pie-chart-visual');
    var barVisual = document.getElementById('bar-chart-visual');
    var legendContainer = document.getElementById('chart-legend-container');
    var svg = document.getElementById('bar-chart-svg');
    var chartContent = document.querySelector('.chart-content');

    pieVisual.style.display = 'none';
    barVisual.style.display = '';
    legendContainer.innerHTML = '';
    chartContent.classList.add('has-bars');

    svg.querySelectorAll('.bar-chart-bar, .bar-chart-grid-line, .bar-chart-axis-text, .bar-chart-value-text, .bar-chart-y-label, .bar-chart-legend').forEach(function (el) { el.remove(); });

    var now = new Date();
    var currentYear = now.getFullYear();
    var currentMonth = now.getMonth() + 1;

    var monthlyIncome = {};
    var monthlyExpense = {};
    for (var m = 1; m <= 12; m++) { monthlyIncome[m] = 0; monthlyExpense[m] = 0; }

    displayTx.forEach(function (t) {
      var d = new Date(t.date + 'T00:00:00');
      if (d.getFullYear() === currentYear) {
        var mIdx = d.getMonth() + 1;
        if (t.type === 'income') {
          monthlyIncome[mIdx] += t.amount;
        } else {
          monthlyExpense[mIdx] += t.amount;
        }
      }
    });

    var allValues = [];
    for (var key in monthlyIncome) { allValues.push(monthlyIncome[key]); }
    for (var key2 in monthlyExpense) { allValues.push(monthlyExpense[key2]); }
    var maxAmount = Math.max(1, Math.max.apply(null, allValues));
    var chartW = 420, chartH = 200;
    var pad = { top: 14, right: 14, bottom: 30, left: 42 };
    var plotW = chartW - pad.left - pad.right;
    var plotH = chartH - pad.top - pad.bottom;
    var barCount = 12, slotGap = 5;
    var slotWidth = (plotW - slotGap * (barCount + 1)) / barCount;
    var barInnerGap = 2;
    var barW = (slotWidth - barInnerGap) / 2;

    ensureBarGradients(svg);

    for (var i = 0; i <= 4; i++) {
      var y = pad.top + (plotH * (4 - i) / 4);
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', pad.left); line.setAttribute('y1', y);
      line.setAttribute('x2', chartW - pad.right); line.setAttribute('y2', y);
      line.setAttribute('class', 'bar-chart-grid-line');
      svg.appendChild(line);

      var val = Math.round(maxAmount * i / 4);
      var lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('x', pad.left - 4); lbl.setAttribute('y', y + 3);
      lbl.setAttribute('class', 'bar-chart-y-label');
      lbl.textContent = val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val;
      svg.appendChild(lbl);
    }

    var legendY = 6;
    var leg1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leg1.setAttribute('x', chartW - 100); leg1.setAttribute('y', legendY);
    leg1.setAttribute('width', 10); leg1.setAttribute('height', 10); leg1.setAttribute('rx', 2);
    leg1.setAttribute('fill', 'url(#bar-income-gradient)');
    leg1.setAttribute('class', 'bar-chart-legend');
    svg.appendChild(leg1);
    var lt1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lt1.setAttribute('x', chartW - 87); lt1.setAttribute('y', legendY + 9);
    lt1.setAttribute('class', 'bar-chart-legend');
    lt1.textContent = '收入';
    svg.appendChild(lt1);

    var leg2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    leg2.setAttribute('x', chartW - 52); leg2.setAttribute('y', legendY);
    leg2.setAttribute('width', 10); leg2.setAttribute('height', 10); leg2.setAttribute('rx', 2);
    leg2.setAttribute('fill', 'url(#bar-expense-gradient)');
    leg2.setAttribute('class', 'bar-chart-legend');
    svg.appendChild(leg2);
    var lt2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lt2.setAttribute('x', chartW - 39); lt2.setAttribute('y', legendY + 9);
    lt2.setAttribute('class', 'bar-chart-legend');
    lt2.textContent = '支出';
    svg.appendChild(lt2);

    var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    var hasAlert = false;

    for (var m2 = 1; m2 <= 12; m2++) {
      var slotX = pad.left + slotGap + (m2 - 1) * (slotWidth + slotGap);
      var incAmt = monthlyIncome[m2] || 0;
      var expAmt = monthlyExpense[m2] || 0;
      var incH = maxAmount > 0 ? (incAmt / maxAmount) * plotH : 0;
      var expH = maxAmount > 0 ? (expAmt / maxAmount) * plotH : 0;
      var incY = pad.top + plotH - incH;
      var expY = pad.top + plotH - expH;
      var isCurrent = m2 === currentMonth;

      var ratio = incAmt > 0 ? expAmt / incAmt : 0;
      var isAlert = incAmt > 0 && ratio >= 0.8;
      if (isAlert) hasAlert = true;

      var incRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      incRect.setAttribute('x', slotX); incRect.setAttribute('y', incY);
      incRect.setAttribute('width', barW); incRect.setAttribute('height', Math.max(incH, 0.5));
      incRect.setAttribute('rx', 2); incRect.setAttribute('class', 'bar-chart-bar');
      incRect.setAttribute('fill', 'url(#bar-income-gradient)');
      incRect.setAttribute('opacity', isCurrent ? '1' : '0.7');
      svg.appendChild(incRect);

      if (incAmt > 0) {
        var vt = createBarValueText(slotX + barW / 2, incY - 12, incAmt);
        vt.setAttribute('fill', '#00E676');
        svg.appendChild(vt);
      }

      var expX = slotX + barW + barInnerGap;
      var expRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      expRect.setAttribute('x', expX); expRect.setAttribute('y', expY);
      expRect.setAttribute('width', barW); expRect.setAttribute('height', Math.max(expH, 0.5));
      expRect.setAttribute('rx', 2); expRect.setAttribute('class', 'bar-chart-bar');
      expRect.setAttribute('fill', isAlert ? '#FF4D4D' : 'url(#bar-expense-gradient)');
      expRect.setAttribute('opacity', isAlert ? '0.9' : (isCurrent ? '1' : '0.7'));
      svg.appendChild(expRect);

      if (expAmt > 0) {
        var vt2 = createBarValueText(expX + barW / 2, expY - 4, expAmt);
        vt2.setAttribute('fill', isAlert ? '#FF4D4D' : 'var(--text-secondary)');
        svg.appendChild(vt2);
      }

      var at = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      at.setAttribute('x', slotX + slotWidth / 2); at.setAttribute('y', chartH - 8);
      at.setAttribute('class', 'bar-chart-axis-text');
      at.textContent = monthNames[m2 - 1];
      svg.appendChild(at);
    }

    var totalExpense = 0;
    for (var key3 in monthlyExpense) { totalExpense += monthlyExpense[key3]; }
    document.getElementById('chart-total-value').innerText = '$' + totalExpense.toLocaleString();

    if (hasAlert) {
      if (VoiceFinance.anime && VoiceFinance.anime.triggerCustom) {
        VoiceFinance.anime.triggerCustom('哇啊啊！主人快住手！本月的支出已經突破收入的 80% 防線了！再買下去我們下個月就要集體去路上吃土了啦！(崩潰) 😭');
      }
    }
  }

  VoiceFinance.charts = {
    colors: categoryColors,
    icons: categoryIcons,
    renderPie: renderCategoryPieChart,
    renderBar: renderBarChart
  };
})();
