// 20 Temples Database
const TEMPLE_DATA = [
  {
    "id": "tc-01",
    "name": "南屯 萬和宮",
    "region": "市區",
    "main_deity": "天上聖母 (老二媽)",
    "birthday_lunar": "三月廿三日",
    "tag": ["求平安", "賞古蹟"],
    "history": "台中市最古老廟宇（建於清康熙），國家三級古蹟。以「老二媽回娘家」與「字姓戲」聞名。",
    "surrounding": "南屯老街（犁頭店）、百年打鐵舖、夏季限定特產「麻芛湯」。",
    "x": 380,
    "y": 320
  },
  {
    "id": "tc-02",
    "name": "東區 樂成宮",
    "region": "市區",
    "main_deity": "天上聖母 (旱溪媽祖)",
    "birthday_lunar": "三月廿三日",
    "tag": ["求平安", "求姻緣", "賞古蹟"],
    "history": "超過200年歷史的三級古蹟，「旱溪媽祖遶境十八庄」名列台灣宗教百景。其配祀之月老星君全台求姻緣最為聞名。",
    "surrounding": "傳統老牌青草茶店（阿嬤青草茶）、旱溪肉圓、晚上有熱鬧的旱溪夜市。",
    "x": 450,
    "y": 290
  },
  {
    "id": "tc-03",
    "name": "東區 南天宮",
    "region": "市區",
    "main_deity": "關聖帝君",
    "birthday_lunar": "六月廿四日",
    "tag": ["求財運", "求平安"],
    "history": "樓頂高達146台尺的巨大關公坐像為著名地標，民間多來此求財（武財神）與祈求行車平安。",
    "surrounding": "台中火車站後站商圈、傳統糕點。適合求財後順道祈求金錢龜。",
    "x": 460,
    "y": 315
  },
  {
    "id": "tc-04",
    "name": "北區 元保宮",
    "region": "市區",
    "main_deity": "保生大帝",
    "birthday_lunar": "三月十五日",
    "tag": ["求健康"],
    "history": "擁有200多年歷史，早期為地方醫療與健康信仰中心，廟宇建築石雕與木雕極具工藝價值。",
    "surrounding": "北區在地老街小吃，傳統中藥行聚落歷史底蘊。",
    "x": 410,
    "y": 260
  },
  {
    "id": "tc-05",
    "name": "中區 萬春宮",
    "region": "市區",
    "main_deity": "天上聖母 (藍興媽)",
    "birthday_lunar": "三月廿三日",
    "tag": ["求平安", "經商順利"],
    "history": "俗稱「台中媽祖」，見證中區老城區百年繁華，廟內高懸光緒皇帝御賜「海晏河清」古匾。",
    "surrounding": "台中中區老城區、第二市場美食（山河魯肉飯、王記菜頭粿）。",
    "x": 425,
    "y": 280
  },
  {
    "id": "tc-06",
    "name": "北屯 文昌廟",
    "region": "市區",
    "main_deity": "文昌帝君",
    "birthday_lunar": "二月初三日",
    "tag": ["求功名"],
    "history": "清光緒年間由地方義塾改建，保存極為完整的傳統書院式四合院廟宇建築。考季時掛滿准考證。",
    "surrounding": "北屯傳統市集小吃，適合準備蔥、蒜、芹菜等傳統供品前往參拜。",
    "x": 435,
    "y": 220
  },
  {
    "id": "tc-07",
    "name": "北屯 廣天宮",
    "region": "市區",
    "main_deity": "五路財神 (趙公明)",
    "birthday_lunar": "三月十五日",
    "tag": ["求財運"],
    "history": "供奉由四川請回、距今千年的開基始祖財神爺金身，為台中極具指標性的補財庫、迎正財聖地。",
    "surrounding": "北屯商圈，廟內提供傳統發財金、財頭金等獨特互動體驗。",
    "x": 455,
    "y": 200
  },
  {
    "id": "tc-08",
    "name": "西屯 張廖家廟",
    "region": "市區",
    "main_deity": "廖氏歷代祖先",
    "birthday_lunar": "冬至祭祖",
    "tag": ["賞古蹟"],
    "history": "國家三級古蹟，傳統客家「雙堂二橫」宗祠建築，木雕與屋頂燕尾脊展現極高之傳統美學。",
    "surrounding": "逢甲商圈外圍，鬧中取靜的清代古厝文史景點。",
    "x": 350,
    "y": 255
  },
  {
    "id": "tc-09",
    "name": "大甲 鎮瀾宮",
    "region": "海線",
    "main_deity": "天上聖母 (大甲媽)",
    "birthday_lunar": "三月廿三日",
    "tag": ["求平安", "全方位"],
    "history": "中台灣信仰重鎮，年度「大甲媽祖遶境進香」名列世界三大宗教盛事，香火終年不斷。",
    "surrounding": "大甲糕餅一條街（奶油酥餅、綠豆椪）、蔣公路夜市、大甲芋頭沙牛奶。",
    "x": 180,
    "y": 100
  },
  {
    "id": "tc-10",
    "name": "清水 紫雲巖",
    "region": "海線",
    "main_deity": "觀世音菩薩",
    "birthday_lunar": "二月十九日",
    "tag": ["求健康", "求子嗣"],
    "history": "在地人稱「觀音亭」，為台中最大的觀音廟。建於清康熙年間，廟內留有乾隆年間古碑記。",
    "surrounding": "清水阿財米糕、王塔米糕、廟前樹下阿婆粉圓冰。",
    "x": 160,
    "y": 165
  },
  {
    "id": "tc-11",
    "name": "大甲 文昌祠",
    "region": "海線",
    "main_deity": "文昌帝君",
    "birthday_lunar": "二月初三日",
    "tag": ["求功名", "賞古蹟"],
    "history": "國家三級古蹟，早期為「大甲義塾」，建築風格古樸，完整保留清代學堂的建築美學與木雕紋飾。",
    "surrounding": "大甲老街區，與鎮瀾宮相距不遠，適合規劃單日文史雙廟之旅。",
    "x": 170,
    "y": 80
  },
  {
    "id": "tc-12",
    "name": "沙鹿 玉皇殿",
    "region": "海線",
    "main_deity": "玉皇上帝 (天公爺)",
    "birthday_lunar": "正月初九日",
    "tag": ["求平安", "改運"],
    "history": "俗稱「沙鹿天公廟」，建於清嘉慶年間，為台灣最具代表性的三座古老天公廟之一。正月初九天公生盛況空前。",
    "surrounding": "沙鹿火車站周邊美食、傳統肉圓、沙鹿大骨湯。",
    "x": 200,
    "y": 215
  },
  {
    "id": "tc-13",
    "name": "大里杙 福興宮",
    "region": "屯區",
    "main_deity": "天上聖母",
    "birthday_lunar": "三月廿三日",
    "tag": ["求平安", "賞古蹟"],
    "history": "位於大里老街，建於乾隆年間。見證舊時大里杙作為全台第四大港口「千帆泊岸」的輝煌歷史。",
    "surrounding": "大里老街、紅磚亭仔腳建築、老街傳統涼麵與古早味豆花。",
    "x": 430,
    "y": 370
  },
  {
    "id": "tc-14",
    "name": "大里 七將軍廟",
    "region": "屯區",
    "main_deity": "七將軍爺",
    "birthday_lunar": "七月初五日",
    "tag": ["尋失物", "求平安"],
    "history": "供奉清代因保護鄉里而殉職的六位清兵與一隻忠犬。民間相傳專司「尋找失物」且極其靈驗。",
    "surrounding": "大里新興商圈，周邊有許多草根美食小吃。",
    "x": 440,
    "y": 395
  },
  {
    "id": "tc-15",
    "name": "烏日 三合里福德祠",
    "region": "屯區",
    "main_deity": "福德正神",
    "birthday_lunar": "二月初二日",
    "tag": ["求財運"],
    "history": "擁有百年歷史，具備獨特的「廟中廟」景觀，古老石敢當與新廟共存，極具文史尋寶價值。",
    "surrounding": "烏日傳統聚落，周邊多稻田與工廠交織的草根地景。",
    "x": 350,
    "y": 380
  },
  {
    "id": "tc-16",
    "name": "豐原 慈濟宮",
    "region": "山線",
    "main_deity": "天上聖母 (豐原媽)",
    "birthday_lunar": "三月廿三日",
    "tag": ["求平安", "賞古蹟"],
    "history": "豐原在地信仰核心，廟宇木雕與石刻保存完好。其側邊延伸出全台聞名的美食廟東夜市。",
    "surrounding": "豐原廟東夜市（清水排骨麵、正老牌肉丸、現炸菱角酥）。",
    "x": 410,
    "y": 140
  },
  {
    "id": "tc-17",
    "name": "東勢 巧聖仙師祖廟",
    "region": "山線",
    "main_deity": "巧聖仙師 (魯班)",
    "birthday_lunar": "五月初七日",
    "tag": ["職場順利", "特殊職掌"],
    "history": "全台灣魯班廟的開基祖廟。見證東勢早期作為台灣重要林業伐木集散地的歷史，為工匠精神象徵。",
    "surrounding": "東勢客家老街、客家粄條、灌蛋餅、東勢林業文化園區。",
    "x": 540,
    "y": 110
  },
  {
    "id": "tc-18",
    "name": "大肚 磺溪書院",
    "region": "山線",
    "main_deity": "文昌帝君",
    "birthday_lunar": "二月初三日",
    "tag": ["求功名", "賞古蹟"],
    "history": "國家三級古蹟，俗稱大肚文昌廟。其「磚雕藝術」堪稱全台第一，燕尾脊與紅磚牆為傳統視覺典範。",
    "surrounding": "大肚田野風光、在地紅磚文創小物、狀元糕。",
    "x": 190,
    "y": 310
  },
  {
    "id": "tc-19",
    "name": "神岡 社口萬興宮",
    "region": "山線",
    "main_deity": "天上聖母",
    "birthday_lunar": "三月廿三日",
    "tag": ["求平安", "賞古蹟"],
    "history": "建於清同治年間，廟內保留大量清代官員、地方仕紳題贈的古匾與石柱，古樸泥塑工藝精湛。",
    "surrounding": "神岡社口犂記餅店（台式月餅發源地）、傳統神岡小吃。",
    "x": 360,
    "y": 160
  },
  {
    "id": "tc-20",
    "name": "南區 醒修宮",
    "region": "市區",
    "main_deity": "關聖帝君",
    "birthday_lunar": "六月廿四日",
    "tag": ["求平安", "求功名"],
    "history": "主祀關聖帝君，香火鼎盛，為台中南區指標性儒宗神教廟宇，殿宇宏偉，環境清幽。",
    "surrounding": "國立公共資訊圖書館、五權車站美食、文青咖啡聚落。",
    "x": 415,
    "y": 325
  }
];

// Almanac / Farmer's Calendar data helper
const LUNAR_ALMANAC = {
  1: { date: "五月初一", yi: ["祭祀", "作灶", "求醫", "治病"], ji: ["嫁娶", "開市", "安葬"] },
  2: { date: "五月初二", yi: ["祈福", "求嗣", "祭祀", "嫁娶", "出行"], ji: ["動土", "破土", "開倉", "詞訟"] },
  3: { date: "五月初三", yi: ["祭祀", "沐浴", "掃舍", "捕捉"], ji: ["會親友", "起基", "蓋屋"] },
  4: { date: "五月初四", yi: ["祭祀", "理髮", "整手足甲", "針灸"], ji: ["嫁娶", "開市", "入宅"] },
  5: { date: "五月初五", yi: ["祭祀", "沐浴", "破屋", "壞垣"], ji: ["移徙", "入宅", "出行"] },
  6: { date: "五月初六", yi: ["祈福", "祭祀", "求嗣", "解除"], ji: ["嫁娶", "安葬", "安門"] },
  7: { date: "五月初七", yi: ["祭祀", "交易", "收養子女", "納財"], ji: ["動土", "破土", "詞訟"] }
};

// Events calendar data (Lunar dates mapped to festival description)
const FESTIVAL_EVENTS = [
  { lunar: "正月初九日", name: "天公生 (玉皇大帝萬壽)", temples: ["tc-12"], desc: "沙鹿玉皇殿舉行大型慶典，信徒湧入祈福安太歲。" },
  { lunar: "二月初二日", name: "土地公聖誕 (頭牙)", temples: ["tc-15"], desc: "烏日三合里福德祠舉辦補財庫法會，分送發財錢母。" },
  { lunar: "二月初三日", name: "文昌帝君聖誕", temples: ["tc-06", "tc-11", "tc-18"], desc: "北屯文昌廟與大肚磺溪書院舉辦狀元及第祈福禮，發放智慧筆。" },
  { lunar: "二月十九日", name: "觀世音菩薩聖誕", temples: ["tc-10"], desc: "清水紫雲巖湧入十方信眾參拜，有傳統戲曲與素食平安麵供奉。" },
  { lunar: "三月十五日", name: "保生大帝/財神聖誕", temples: ["tc-04", "tc-07"], desc: "廣天宮迎請五路財神招財法會，元保宮保生大帝出巡遶境。" },
  { lunar: "三月廿三日", name: "媽祖聖誕 (聖母聖誕)", temples: ["tc-01", "tc-02", "tc-05", "tc-09", "tc-13", "tc-16", "tc-19"], desc: "大甲鎮瀾宮媽祖遶境進香、萬和宮字姓戲、樂成宮旱溪媽祖遶境十八庄盛大登場！" },
  { lunar: "五月初七日", name: "巧聖仙師魯班誕辰", temples: ["tc-17"], desc: "東勢巧聖仙師祖廟舉辦魯班先師文化祭，百工職人齊聚祭祖。" },
  { lunar: "六月廿四日", name: "關聖帝君聖誕", temples: ["tc-03", "tc-20"], desc: "南天宮高達146尺關老爺神像前，舉辦祈福大典與行車改運儀式。" },
  { lunar: "七月初五日", name: "七將軍爺千秋", temples: ["tc-14"], desc: "大里七將軍廟民俗祈求失物、行善助人法會，演戲酬神連月。" },
  { lunar: "冬至祭祖", name: "張廖家廟冬至祭祖", temples: ["tc-08"], desc: "西屯張廖家廟遵循古禮舉辦崇祖大典，廖氏宗親齊聚吃湯圓。" }
];

// Stalls mapping for Fengyuan Miaodong Market (tc-16)
const NIGHT_MARKET_STALLS = [
  { id: "s-1", name: "清水排骨麵", x: 25, y: 35, desc: "排骨先炸後蒸，骨肉即化，湯頭充滿油蔥酥與肉香，每日排隊人潮不斷。" },
  { id: "s-2", name: "正老牌肉丸", x: 45, y: 55, desc: "油炸肉圓皮Q彈，肉餡紮實，搭配特製的粉紅甜醬，吃完還能用碗底餘醬沖大骨湯。" },
  { id: "s-3", name: "正兆蚵仔煎", x: 65, y: 30, desc: "獨家特調的「花生芝麻沙茶醬」香氣濃郁，底部的空心菜與鮮蚵份量充足。" },
  { id: "s-4", name: "廟東菱角酥", x: 15, y: 70, desc: "廟口最吸睛的小點心！新鮮菱角裹上麵糊下油鍋，現炸成金黃小球，口感酥脆蓬鬆。" },
  { id: "s-5", name: "金樹冰果室", x: 80, y: 65, desc: "超過七十年的老字號，招牌鳳梨冰酸甜古早味，加上一球香草冰淇淋是饕客吃法。" }
];

// App State variables
let currentSelectedTempleId = "tc-01";
let activeTagFilter = "";
let currentCalendarDay = 2; // Default to June 16, 2026 (五月初二)

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  setupAlmanacTicker();
  setupTabs();
  renderMap();
  setupFilters();
  renderBookView(currentSelectedTempleId);
  setupCalendar();
  setupFoodMarket();
  
  // Set default view to Map
  switchTab("map");
});

// 1. Almanac Ticker Setup
function setupAlmanacTicker() {
  const tickerText = document.getElementById("almanac-ticker-text");
  if (!tickerText) return;
  
  // Set dynamic date in header
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  
  // Static demonstration mapping for June 16, 2026
  tickerText.innerHTML = `
    <span>歲次丙午年 五月初二</span> &nbsp;|&nbsp;
    <span class="text-secondary font-bold">宜：</span>祈福、求嗣、祭祀、嫁娶、出行 &nbsp;|&nbsp;
    <span class="text-primary font-bold">忌：</span>動土、破土、開倉、詞訟 &nbsp;|&nbsp;
    <span>【台中廟事錄】祝您闔府平安，萬事如意。</span>
  `;
}

// 2. Tab Navigation
function setupTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const view = tab.getAttribute("data-view");
      switchTab(view);
    });
  });
}

function switchTab(viewId) {
  // Update Tab active styling
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    if (tab.getAttribute("data-view") === viewId) {
      tab.classList.add("bg-primary", "text-paper");
      tab.classList.remove("bg-paper", "text-charcoal");
      tab.style.borderBottom = "none";
    } else {
      tab.classList.remove("bg-primary", "text-paper");
      tab.classList.add("bg-paper", "text-charcoal");
      tab.style.borderBottom = "1px solid var(--color-smoked-gold)";
    }
  });

  // Switch display of view containers
  const containers = document.querySelectorAll(".view-container");
  containers.forEach(container => {
    if (container.id === `${viewId}-view`) {
      container.classList.remove("hidden");
    } else {
      container.classList.add("hidden");
    }
  });
}

// 3. Map Drawing & Logic
function renderMap() {
  const mapSvg = document.getElementById("map-canvas");
  if (!mapSvg) return;

  // Clear existing lantern markers (keep paths)
  const existingLanterns = mapSvg.querySelectorAll(".lantern-marker");
  existingLanterns.forEach(l => l.remove());

  // Render 20 temple coordinates as pulsing red lanterns
  TEMPLE_DATA.forEach(temple => {
    // Check filter
    const matchesFilter = !activeTagFilter || temple.tag.includes(activeTagFilter);
    const filterClass = matchesFilter ? "lantern-active" : "lantern-faded";

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", `lantern-marker cursor-pointer ${filterClass} transition-all duration-300`);
    g.setAttribute("transform", `translate(${temple.x}, ${temple.y})`);
    g.setAttribute("data-id", temple.id);

    // Lantern Pulse ring (only active/matched ones)
    if (matchesFilter) {
      const pulseRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pulseRing.setAttribute("r", "16");
      pulseRing.setAttribute("fill", "none");
      pulseRing.setAttribute("stroke", "var(--color-imperial-red)");
      pulseRing.setAttribute("stroke-width", "2");
      pulseRing.setAttribute("opacity", "0.6");
      pulseRing.setAttribute("class", "animate-ping");
      g.appendChild(pulseRing);
    }

    // Outer lantern shape
    const baseCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    baseCircle.setAttribute("r", "8");
    baseCircle.setAttribute("fill", matchesFilter ? "var(--color-imperial-red)" : "#d1cfc7");
    baseCircle.setAttribute("stroke", "var(--color-smoked-gold)");
    baseCircle.setAttribute("stroke-width", "1.5");
    g.appendChild(baseCircle);

    // Gold core
    const coreCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    coreCircle.setAttribute("r", "3");
    coreCircle.setAttribute("fill", matchesFilter ? "var(--color-smoked-gold)" : "#a8a7a1");
    g.appendChild(coreCircle);

    // Label / Text banner on hover
    const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    textGroup.setAttribute("class", "lantern-label pointer-events-none opacity-0 transition-opacity duration-200");
    textGroup.setAttribute("transform", "translate(0, -16)");

    const textBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    textBg.setAttribute("x", "-60");
    textBg.setAttribute("y", "-12");
    textBg.setAttribute("width", "120");
    textBg.setAttribute("height", "22");
    textBg.setAttribute("rx", "3");
    textBg.setAttribute("fill", "var(--color-charcoal-black)");
    textBg.setAttribute("stroke", "var(--color-smoked-gold)");
    textBg.setAttribute("stroke-width", "1");
    textGroup.appendChild(textBg);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "var(--color-paper-white)");
    text.setAttribute("font-size", "11px");
    text.setAttribute("font-family", "'Noto Serif TC', serif");
    text.setAttribute("y", "3");
    text.textContent = temple.name;
    textGroup.appendChild(text);

    g.appendChild(textGroup);

    // Interaction Events
    g.addEventListener("mouseenter", () => {
      textGroup.setAttribute("class", "lantern-label pointer-events-none opacity-100 transition-opacity duration-200");
    });
    g.addEventListener("mouseleave", () => {
      textGroup.setAttribute("class", "lantern-label pointer-events-none opacity-0 transition-opacity duration-200");
    });
    g.addEventListener("click", () => {
      selectTemple(temple.id);
    });

    mapSvg.appendChild(g);
  });
}

// 4. Cinnabar Stamp Filter Setup
function setupFilters() {
  const stamps = document.querySelectorAll(".stamp-filter");
  stamps.forEach(stamp => {
    stamp.addEventListener("click", () => {
      const tag = stamp.getAttribute("data-tag");
      
      // Toggle active filter
      if (activeTagFilter === tag) {
        activeTagFilter = "";
        stamp.classList.remove("stamp-active");
      } else {
        stamps.forEach(s => s.classList.remove("stamp-active"));
        activeTagFilter = tag;
        stamp.classList.add("stamp-active");
      }
      
      // Rerender Map Lanterns & Side Panel
      renderMap();
      renderFilteredList();
    });
  });

  renderFilteredList();
}

function renderFilteredList() {
  const listContainer = document.getElementById("temple-filtered-list");
  if (!listContainer) return;

  listContainer.innerHTML = "";
  const filtered = TEMPLE_DATA.filter(t => !activeTagFilter || t.tag.includes(activeTagFilter));

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-8 text-stone-500 font-serif">
        尋無符合此祈求之宮廟。
      </div>
    `;
    return;
  }

  filtered.forEach(temple => {
    const card = document.createElement("div");
    card.className = `p-4 mb-3 rounded border border-smoked-gold bg-paper/60 hover:bg-paper cursor-pointer transition-all duration-300 ${temple.id === currentSelectedTempleId ? 'shadow-md ring-1 ring-primary' : ''}`;
    card.innerHTML = `
      <div class="flex justify-between items-center mb-1">
        <h4 class="font-bold text-primary text-lg font-serif">${temple.name}</h4>
        <span class="px-2 py-0.5 text-xs text-paper bg-secondary rounded">${temple.region}</span>
      </div>
      <p class="text-sm text-stone-700 font-serif mb-2"><strong class="text-stone-900">主神：</strong>${temple.main_deity}</p>
      <div class="flex flex-wrap gap-1">
        ${temple.tag.map(tg => `<span class="text-xs border border-smoked-gold/60 text-amber-900 px-1.5 py-0.2 rounded bg-amber-50/20">${tg}</span>`).join('')}
      </div>
    `;
    card.addEventListener("click", () => {
      selectTemple(temple.id);
    });
    listContainer.appendChild(card);
  });
}

function selectTemple(templeId) {
  currentSelectedTempleId = templeId;
  
  // Highlight card list
  renderFilteredList();
  
  // Auto switch and load in thread-bound book details
  renderBookView(templeId);
  switchTab("book");
}

// 5. Thread-Bound Book View Details
function renderBookView(templeId) {
  const temple = TEMPLE_DATA.find(t => t.id === templeId) || TEMPLE_DATA[0];
  const bookContainer = document.getElementById("book-content-wrapper");
  if (!bookContainer) return;

  // Apply page flip animation classes
  bookContainer.classList.add("opacity-0", "translate-x-4");

  setTimeout(() => {
    bookContainer.innerHTML = `
      <!-- Left Page: Calligraphy & Seal -->
      <div class="flex-1 p-8 pr-12 border-r border-dashed border-smoked-gold/40 flex flex-col justify-between items-center text-center select-none min-h-[460px]">
        <div class="w-full flex justify-between items-center border-b border-smoked-gold/30 pb-2 mb-4">
          <span class="text-xs text-stone-500 font-serif">台中廟事錄‧尋神問事</span>
          <span class="text-xs text-stone-500 font-serif">${temple.region}</span>
        </div>
        
        <div class="my-auto">
          <!-- Main Deity Large Calligraphy -->
          <h2 class="text-4xl md:text-5xl font-calligraphy text-primary tracking-widest leading-relaxed mb-6">
            ${temple.main_deity.split(' ').join('<br>')}
          </h2>
          <!-- Secondary tag -->
          <div class="flex justify-center gap-2 mt-4">
            <span class="px-3 py-1 border border-primary text-primary font-serif rounded-full text-xs">
              誕辰：${temple.birthday_lunar}
            </span>
          </div>
        </div>

        <!-- Red Seal Stamp Graphic -->
        <div class="mt-8 flex flex-col items-center">
          <div class="w-16 h-16 border-2 border-primary/95 text-primary/95 flex items-center justify-center font-bold text-center leading-none text-xs rounded select-none rotate-3 p-1 font-serif scale-110 shadow-sm transition-transform duration-300 hover:rotate-0 hover:scale-120 active:scale-95" style="border-style: double; border-width: 4px; box-shadow: 0 0 1px rgba(166,28,28,0.2);">
            ${temple.name.replace(" ", "<br>")}
          </div>
          <span class="text-[10px] text-stone-400 font-serif mt-2">硃砂古印‧信士常保</span>
        </div>
      </div>

      <!-- Right Page: Vernacular Story & Art -->
      <div class="flex-1 p-8 pl-12 flex flex-col justify-between min-h-[460px]">
        <div class="w-full flex justify-between items-center border-b border-smoked-gold/30 pb-2 mb-4">
          <span class="text-xs text-stone-500 font-serif">${temple.name}</span>
          <span class="text-xs text-stone-500 font-serif">建廟記史</span>
        </div>

        <div class="my-auto">
          <!-- History Story -->
          <h3 class="text-xl font-bold text-stone-900 font-serif border-l-4 border-primary pl-3 mb-3">建廟沿革與歷史</h3>
          <p class="text-stone-700 leading-relaxed font-serif text-base mb-6 text-justify">
            ${temple.history}
          </p>

          <!-- Surroundings / Art Details -->
          <h3 class="text-xl font-bold text-stone-900 font-serif border-l-4 border-secondary pl-3 mb-3">廟口美食與周邊物產</h3>
          <p class="text-stone-700 leading-relaxed font-serif text-base text-justify">
            ${temple.surrounding}
          </p>
        </div>

        <div class="flex justify-between items-center border-t border-smoked-gold/30 pt-3 mt-6">
          <div class="flex gap-2">
            ${temple.tag.map(t => `<span class="px-2 py-0.5 text-xs bg-secondary/10 text-secondary border border-secondary/20 rounded font-serif">${t}</span>`).join('')}
          </div>
          <button onclick="switchTab('map')" class="text-xs text-primary font-serif font-bold hover:underline">
            ← 返回輿圖尋找
          </button>
        </div>
      </div>
    `;

    bookContainer.classList.remove("opacity-0", "translate-x-4");
  }, 200);
}

// 6. Tear-off Farmer's Calendar Logic
function setupCalendar() {
  const prevBtn = document.getElementById("cal-prev-btn");
  const nextBtn = document.getElementById("cal-next-btn");

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentCalendarDay > 1) {
        currentCalendarDay--;
        renderCalendarPage();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentCalendarDay < 7) {
        currentCalendarDay++;
        renderCalendarPage();
      }
    });
  }

  renderCalendarPage();
}

function renderCalendarPage() {
  const almanac = LUNAR_ALMANAC[currentCalendarDay];
  const calContent = document.getElementById("calendar-tear-page");
  if (!calContent || !almanac) return;

  // Gregorian Mapping
  const gregDates = {
    1: { month: "六月", day: "15", week: "星期一" },
    2: { month: "六月", day: "16", week: "星期二" },
    3: { month: "六月", day: "17", week: "星期三" },
    4: { month: "六月", day: "18", week: "星期四" },
    5: { month: "六月", day: "19", week: "星期五" },
    6: { month: "六月", day: "20", week: "星期六" },
    7: { month: "六月", day: "21", week: "星期日" }
  };
  const greg = gregDates[currentCalendarDay];

  // Check if there are matches in festival calendar
  // We can match based on lunar date strings (e.g. "五月初二" from LUNAR_ALMANAC to events)
  const matchingEvents = FESTIVAL_EVENTS.filter(evt => {
    // For demonstration, map days:
    // Day 2 (五月初二): match to "二月初二日" (simplified) or "五月初七" (Day 7)
    if (currentCalendarDay === 7) return evt.lunar === "五月初七日";
    return false; // Only Day 7 has local event in this range for demonstration
  });

  let eventsHtml = "";
  if (matchingEvents.length > 0) {
    eventsHtml = matchingEvents.map(evt => `
      <div class="relative p-4 border-2 border-primary bg-amber-50/30 rounded overflow-hidden shadow-sm my-4">
        <!-- Stamp: 鬧熱 -->
        <div class="absolute right-4 top-2 w-12 h-12 border-2 border-primary text-primary flex items-center justify-center font-bold text-sm rounded-full rotate-12 opacity-80 select-none font-serif" style="border-style: dotted; border-width: 3px;">
          鬧熱
        </div>
        <h4 class="font-bold text-primary font-serif mb-1">${evt.name}</h4>
        <p class="text-sm text-stone-700 font-serif leading-relaxed">${evt.desc}</p>
        <div class="mt-2 flex gap-2">
          ${evt.temples.map(tid => {
            const tmp = TEMPLE_DATA.find(t => t.id === tid);
            return tmp ? `<button onclick="selectTemple('${tid}')" class="text-xs bg-primary text-paper px-2 py-0.5 rounded font-serif hover:bg-red-800">${tmp.name}</button>` : '';
          }).join('')}
        </div>
      </div>
    `).join('');
  } else {
    eventsHtml = `
      <div class="py-6 text-center text-stone-500 font-serif text-sm border border-stone-200 bg-white/40 rounded">
        本日無重大廟會活動。適合參香祈福、闔家安康。
      </div>
    `;
  }

  calContent.innerHTML = `
    <!-- Top tear edge styling -->
    <div class="h-4 bg-red-800 flex justify-around items-center px-4 rounded-t">
      <div class="w-3 h-3 rounded-full bg-stone-300"></div>
      <div class="w-3 h-3 rounded-full bg-stone-300"></div>
      <div class="w-3 h-3 rounded-full bg-stone-300"></div>
      <div class="w-3 h-3 rounded-full bg-stone-300"></div>
    </div>
    
    <div class="p-6 md:p-8 flex flex-col items-center justify-between min-h-[380px] bg-paper">
      <!-- Date Details -->
      <div class="w-full flex justify-between items-center text-stone-600 font-serif border-b border-stone-300 pb-2">
        <span class="text-sm">${greg.month} ${greg.week}</span>
        <span class="text-sm">中華民國一一五年</span>
      </div>

      <!-- Large Day Number -->
      <div class="my-4 text-center">
        <h1 class="text-7xl font-bold text-charcoal font-serif leading-none">${greg.day}</h1>
        <p class="text-xl text-primary font-bold font-serif tracking-widest mt-2">${almanac.date}</p>
      </div>

      <!-- Yi & Ji Section -->
      <div class="w-full grid grid-cols-2 gap-4 border-t border-b border-stone-300 py-4 mb-4 select-none">
        <div class="text-center border-r border-stone-300 pr-2">
          <div class="inline-block px-3 py-0.5 bg-secondary text-paper font-bold rounded text-xs mb-2 font-serif">宜</div>
          <p class="text-sm font-serif text-emerald-950 font-bold leading-relaxed">${almanac.yi.join('、')}</p>
        </div>
        <div class="text-center pl-2">
          <div class="inline-block px-3 py-0.5 bg-primary text-paper font-bold rounded text-xs mb-2 font-serif">忌</div>
          <p class="text-sm font-serif text-red-950 font-bold leading-relaxed">${almanac.ji.join('、')}</p>
        </div>
      </div>

      <!-- Festival info output -->
      <div class="w-full text-left">
        <h5 class="text-xs font-bold text-stone-500 font-serif mb-2">✦ 歲時活動記事</h5>
        ${eventsHtml}
      </div>
    </div>
  `;
}

// 7. Food Market & Hand-drawn guide
function setupFoodMarket() {
  const stallContainer = document.getElementById("market-map-canvas");
  if (!stallContainer) return;

  // Clear previous stalls
  stallContainer.innerHTML = "";

  // Render stall indicators on the night market schematic background
  NIGHT_MARKET_STALLS.forEach(stall => {
    const btn = document.createElement("button");
    btn.className = "absolute w-6 h-6 rounded-full bg-glazed-green border border-smoked-gold text-paper text-[10px] font-bold flex items-center justify-center cursor-pointer shadow hover:scale-125 hover:bg-emerald-800 transition-all duration-200 active:scale-95";
    btn.style.left = `${stall.x}%`;
    btn.style.top = `${stall.y}%`;
    btn.innerHTML = `<span class="pointer-events-none">食</span>`;
    
    // Trigger popup
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      showStallDetail(stall);
    });

    stallContainer.appendChild(btn);
  });
}

function showStallDetail(stall) {
  const detailBox = document.getElementById("stall-detail-panel");
  if (!detailBox) return;

  detailBox.innerHTML = `
    <h4 class="font-bold text-secondary font-serif text-lg mb-2">${stall.name}</h4>
    <p class="text-sm text-stone-700 leading-relaxed font-serif">${stall.desc}</p>
    <div class="mt-3 text-[11px] text-amber-900 border-t border-dashed border-smoked-gold/40 pt-2 flex items-center gap-1 font-serif">
      📍 豐原慈濟宮旁（廟東夜市內）
    </div>
  `;
}
