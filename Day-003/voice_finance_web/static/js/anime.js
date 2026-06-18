// ==========================================================================
// VoiceFinance.anime — Anime Assistant Quote Engine
// ==========================================================================
(function () {
  window.VoiceFinance = window.VoiceFinance || {};

  var animeAssistantQuotes = {
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
    ],
    onProactiveBudget: [
      "主人！本月預計還有固定貸款與排程費用即將扣款，我們目前的實際可用預算要扣掉這些哦，錢包記得捏緊一點點！(盯—) 🧊",
      "咳咳…主人，本月的定期支出總計約 $RECURRING_AMOUNT 元，別忘了留預算給它們喔！不然月底就只能吃土了～😅",
      "警報警報！本助理偵測到本月還有一堆固定的繳費排程，主人請務必把這些算進生活開銷裡呀！💰",
      "（翻帳本）主人～這個月還有幾筆固定的支出要繳呢，加起來差不多 $RECURRING_AMOUNT 元，別說我沒提醒你喔！😼",
      "主人！你確定這個月亂買東西前，有先把電信費跟貸款的預算留下來嗎？本助理幫你算了一下～約 $RECURRING_AMOUNT 元！🛡️"
    ]
  };

  var typewriterTimer = null;

  function triggerAnimeQuote(eventType) {
    var quotes = animeAssistantQuotes[eventType];
    if (!quotes || quotes.length === 0) return;
    var randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    var textEl = document.getElementById('manga-bubble-text');
    var cursorEl = document.getElementById('typewriter-cursor');
    var bubble = document.getElementById('manga-bubble');

    if (typewriterTimer) clearTimeout(typewriterTimer);
    bubble.classList.add('visible');
    cursorEl.classList.remove('paused');

    var i = -1;
    var chars = randomQuote.split('');
    function typeNext() {
      if (typewriterTimer) clearTimeout(typewriterTimer);
      i++;
      if (i < chars.length) {
        textEl.textContent = chars.slice(0, i + 1).join('');
        typewriterTimer = setTimeout(typeNext, 40 + Math.random() * 25);
      } else {
        cursorEl.classList.add('paused');
        typewriterTimer = setTimeout(function () {
          bubble.classList.remove('visible');
          textEl.textContent = '';
        }, 6000);
      }
    }
    typeNext();
  }

  function triggerAnimeCustomQuote(customText) {
    var textEl = document.getElementById('manga-bubble-text');
    var cursorEl = document.getElementById('typewriter-cursor');
    var bubble = document.getElementById('manga-bubble');

    if (typewriterTimer) clearTimeout(typewriterTimer);
    bubble.classList.add('visible');
    cursorEl.classList.remove('paused');

    var i = -1;
    var chars = customText.split('');
    function typeNext() {
      if (typewriterTimer) clearTimeout(typewriterTimer);
      i++;
      if (i < chars.length) {
        textEl.textContent = chars.slice(0, i + 1).join('');
        typewriterTimer = setTimeout(typeNext, 40 + Math.random() * 25);
      } else {
        cursorEl.classList.add('paused');
        typewriterTimer = setTimeout(function () {
          bubble.classList.remove('visible');
          textEl.textContent = '';
        }, 7000);
      }
    }
    typeNext();
  }

  VoiceFinance.anime = {
    quotes: animeAssistantQuotes,
    triggerQuote: triggerAnimeQuote,
    triggerCustom: triggerAnimeCustomQuote
  };
})();
