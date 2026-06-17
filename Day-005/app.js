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
    "lat": 24.1365,
    "lng": 120.6464
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
    "lat": 24.1435,
    "lng": 120.6921
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
    "lat": 24.1365,
    "lng": 120.6921
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
    "lat": 24.1575,
    "lng": 120.6828
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
    "lat": 24.1445,
    "lng": 120.6828
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
    "lat": 24.1785,
    "lng": 120.6944
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
    "lat": 24.1855,
    "lng": 120.7037
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
    "lat": 24.1715,
    "lng": 120.6371
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
    "lat": 24.3455,
    "lng": 120.6214
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
    "lat": 24.2665,
    "lng": 120.5757
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
    "lat": 24.3525,
    "lng": 120.6121
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
    "lat": 24.2365,
    "lng": 120.5664
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
    "lat": 24.0985,
    "lng": 120.6828
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
    "lat": 24.0845,
    "lng": 120.6921
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
    "lat": 24.1065,
    "lng": 120.6283
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
    "lat": 24.2525,
    "lng": 120.7171
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
    "lat": 24.2595,
    "lng": 120.8286
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
    "lat": 24.1505,
    "lng": 120.5471
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
    "lat": 24.2365,
    "lng": 120.6921
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
    "lat": 24.1225,
    "lng": 120.6600
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

// Deity Hierarchy / Pantheon Data
const HIERARCHY_DATA = [
  {
    "level": 1,
    "level_name": "第一層：宇宙源流・至高天尊",
    "deities": [
      {
        "name": "三清道祖",
        "title": "元始天尊 / 靈寶天尊 / 道德天尊",
        "story": "宇宙化生之最高本源，象徵洪元、混元、太初三個宇宙世紀。",
        "duty": "宇宙運行、至高祈福"
      }
    ]
  },
  {
    "level": 2,
    "level_name": "第二層：天界主宰・萬神帝王",
    "deities": [
      {
        "name": "玉皇上帝",
        "title": "天公爺",
        "story": "歷經三千二百劫證得金仙，天界最高行政首長，總管三界六道。",
        "duty": "改運、謝恩、大辟庇護",
        "temple_id": "tc-12"
      }
    ]
  },
  {
    "level": 4,
    "level_name": "第四層：督察與救度主宰",
    "deities": [
      {
        "name": "天上聖母",
        "title": "媽祖 / 林默娘",
        "story": "宋代湄洲奇女子，能乘蓆渡海解救漁船，台灣最具影響力的全方位護國佑民之神。",
        "duty": "消災解厄、出海平安、全方位祈福",
        "temple_id": ["tc-01", "tc-02", "tc-05", "tc-09", "tc-13", "tc-16", "tc-19"]
      }
    ]
  }
];
let currentSelectedTempleId = "tc-01";
let activeTagFilter = "";
let currentCalendarDay = 2; // Default to June 16, 2026 (五月初二)
let leafletMap = null;
let leafletMarkers = [];

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  setupAlmanacTicker();
  setupTabs();
  renderMap();
  setupFilters();
  renderBookView(currentSelectedTempleId);
  setupCalendar();
  setupFoodMarket();
  setupHierarchy();
  setupJiaobei();
  setupFortune();
  
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

  // Invalidate Leaflet map size when map tab becomes visible
  if (viewId === "map" && leafletMap) {
    setTimeout(() => {
      leafletMap.invalidateSize();
    }, 100);
  }
}

// 3. Map Drawing & Logic (Leaflet.js)
function renderMap() {
  const mapContainer = document.getElementById("leaflet-map");
  if (!mapContainer) return;

  // Initialize map only once
  if (!leafletMap) {
    leafletMap = L.map("leaflet-map", {
      center: [24.25, 120.72],
      zoom: 11,
      zoomControl: true,
      attributionControl: false
    });

    // OpenStreetMap tile layer (free, no API key)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    }).addTo(leafletMap);
  }

  // Clear existing markers
  leafletMarkers.forEach(m => m.remove());
  leafletMarkers = [];

  // Create custom markers for each temple
  TEMPLE_DATA.forEach(temple => {
    const matchesFilter = !activeTagFilter || temple.tag.includes(activeTagFilter);

    // Build marker HTML: dual-layer structure
    // Outer: fixed hit area (group), Inner: visual lantern with animation
    const markerHtml = `
      <div class="marker-hit-area ${matchesFilter ? '' : 'marker-faded'}">
        ${matchesFilter ? '<div class="marker-pulse-ring"></div>' : ''}
        <div class="marker-visual">
          <div class="marker-lantern">
            <div class="marker-lantern-body">
              <span class="marker-lantern-text">${temple.name.split(' ')[0].substring(0, 2)}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      html: markerHtml,
      className: 'custom-leaflet-marker',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    const marker = L.marker([temple.lat, temple.lng], { icon: icon });

    // Build custom popup content
    const popupContent = `
      <div class="popup-vintage">
        <div class="popup-header">
          <span class="popup-temple-name">${temple.name}</span>
          <span class="popup-region-tag">${temple.region}</span>
        </div>
        <div class="popup-deity">
          <strong>主神：</strong>${temple.main_deity}
        </div>
        <p class="popup-history">${temple.history}</p>
        <div class="popup-tags">
          ${temple.tag.map(t => `<span class="popup-tag">${t}</span>`).join('')}
        </div>
        <button class="popup-detail-btn" onclick="selectTemple('${temple.id}')">
          進入線裝書查看完整記載 →
        </button>
        <div class="popup-seal">
          <span class="popup-seal-text">台中<br>廟事</span>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      minWidth: 240,
      closeButton: true,
      offset: [0, -8]
    });

    marker.addTo(leafletMap);
    leafletMarkers.push(marker);
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
  renderFilteredList();

  const temple = TEMPLE_DATA.find(t => t.id === templeId);
  if (temple && leafletMap) {
    leafletMap.setView([temple.lat, temple.lng], 13, { animate: true, duration: 0.8 });
    const marker = leafletMarkers.find(m => {
      const ll = m.getLatLng();
      return Math.abs(ll.lat - temple.lat) < 0.0001 && Math.abs(ll.lng - temple.lng) < 0.0001;
    });
    if (marker) {
      switchTab("map");
      setTimeout(() => { marker.openPopup(); }, 600);
      return;
    }
  }

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
          <div class="flex items-center gap-3">
            <button onclick="openJiaobeiModal('${temple.id}')" class="text-xs text-primary font-serif font-bold border border-primary/40 px-3 py-1.5 rounded hover:bg-primary hover:text-paper transition-all duration-200">
              🙏 向神明請示
            </button>
            <button onclick="switchTab('map')" class="text-xs text-primary font-serif font-bold hover:underline">
              ← 返回輿圖尋找
            </button>
          </div>
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

// 8. Deity Hierarchy / Pantheon (神譜體系)
function setupHierarchy() {
  const container = document.getElementById("hierarchy-tree");
  if (!container) return;

  container.innerHTML = "";

  HIERARCHY_DATA.forEach((layer, layerIndex) => {
    const layerDiv = document.createElement("div");
    layerDiv.className = "hierarchy-layer mb-10 flex flex-col items-center";

    // Layer header bar
    const headerBar = document.createElement("div");
    headerBar.className = "w-full max-w-2xl text-center mb-4 py-2 rounded-sm";
    headerBar.style.backgroundColor = layerIndex === 0 ? "#1a1a1a" : layerIndex === 1 ? "#5c4a1f" : "#4a1a1a";
    headerBar.innerHTML = `
      <span class="text-accent font-bold font-serif text-lg tracking-widest">${layer.level_name}</span>
      <div class="text-[10px] text-accent/70 mt-0.5 font-serif">第 ${layer.level} 層神階</div>
    `;

    layerDiv.appendChild(headerBar);

    // Connector line from header to cards
    const connector = document.createElement("div");
    connector.className = "w-0.5 h-8 mx-auto";
    connector.style.backgroundColor = "var(--color-smoked-gold)";
    connector.style.opacity = "0.5";
    layerDiv.appendChild(connector);

    // Deity cards grid
    const cardsRow = document.createElement("div");
    cardsRow.className = "flex flex-wrap justify-center gap-6 w-full max-w-4xl";

    layer.deities.forEach(deity => {
      const card = document.createElement("div");
      card.className = "deity-card relative p-6 rounded border-2 border-accent/60 bg-paper/70 shadow-lg flex flex-col items-center text-center max-w-sm w-full transition-all duration-300 hover:shadow-xl hover:border-primary";

      // Corner ornaments
      const cornerTL = document.createElement("div");
      cornerTL.className = "absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-accent/60";
      card.appendChild(cornerTL);
      const cornerTR = document.createElement("div");
      cornerTR.className = "absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-accent/60";
      card.appendChild(cornerTR);
      const cornerBL = document.createElement("div");
      cornerBL.className = "absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-accent/60";
      card.appendChild(cornerBL);
      const cornerBR = document.createElement("div");
      cornerBR.className = "absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-accent/60";
      card.appendChild(cornerBR);

      // Deity Name (calligraphy style)
      const nameEl = document.createElement("h3");
      nameEl.className = "text-2xl font-calligraphy text-primary mb-1 tracking-wider";
      nameEl.textContent = deity.name;
      card.appendChild(nameEl);

      // Title
      const titleEl = document.createElement("p");
      titleEl.className = "text-xs text-accent font-serif tracking-wide mb-3";
      titleEl.textContent = deity.title;
      card.appendChild(titleEl);

      // Divider
      const divider = document.createElement("div");
      divider.className = "w-16 h-px bg-accent/40 mb-3";
      card.appendChild(divider);

      // Story
      const storyEl = document.createElement("p");
      storyEl.className = "text-sm text-stone-700 font-serif leading-relaxed mb-3";
      storyEl.textContent = deity.story;
      card.appendChild(storyEl);

      // Duty tag
      const dutyEl = document.createElement("div");
      dutyEl.className = "flex flex-wrap justify-center gap-1 mb-4";
      const duties = deity.duty.split("、");
      duties.forEach(d => {
        const tag = document.createElement("span");
        tag.className = "px-2 py-0.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full font-serif";
        tag.textContent = d;
        dutyEl.appendChild(tag);
      });
      card.appendChild(dutyEl);

      // Connected Temples
      if (deity.temple_id) {
        const templeIds = Array.isArray(deity.temple_id) ? deity.temple_id : [deity.temple_id];
        const templeSection = document.createElement("div");
        templeSection.className = "w-full border-t border-accent/20 pt-3";

        const templeLabel = document.createElement("p");
        templeLabel.className = "text-[11px] text-stone-400 font-serif mb-2";
        templeLabel.textContent = "⚡ 台中主祀宮廟：";
        templeSection.appendChild(templeLabel);

        const templeList = document.createElement("div");
        templeList.className = "flex flex-wrap gap-1.5";

        templeIds.forEach(tid => {
          const t = TEMPLE_DATA.find(td => td.id === tid);
          if (t) {
            const templeBtn = document.createElement("button");
            templeBtn.className = "text-xs bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 rounded font-serif hover:bg-secondary hover:text-paper transition-colors duration-200";
            templeBtn.textContent = t.name.replace(/^(.*?)\s/, "");
            templeBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              selectTemple(tid);
            });
            templeList.appendChild(templeBtn);
          }
        });

        templeSection.appendChild(templeList);
        card.appendChild(templeSection);
      }

      cardsRow.appendChild(card);
    });

    layerDiv.appendChild(cardsRow);

    // Inter-layer connector (except last)
    if (layerIndex < HIERARCHY_DATA.length - 1) {
      const interConnector = document.createElement("div");
      interConnector.className = "w-full flex justify-center mt-2";
      const line = document.createElement("div");
      line.className = "w-0.5 h-10";
      line.style.backgroundColor = "var(--color-smoked-gold)";
      line.style.opacity = "0.4";
      interConnector.appendChild(line);
      layerDiv.appendChild(interConnector);
    }

    container.appendChild(layerDiv);
  });
}

// =============================================
// 9. 擲筊杯 (Jiaobei Fortune Casting) System
// =============================================

const jiaobeiState = {
  isThrowing: false,
  currentTempleId: null,
  streak: { sheng: 0, xiao: 0, yin: 0 },
  totalThrows: 0
};

const JIAOBEI_RESULTS = {
  sheng: {
    name: '聖筊',
    color: '#A61C1C',
    icon: '🔴',
    messages: [
      '恭得聖筊！神明應允，心中所求必得庇佑。',
      '聖筊降臨！神明微笑點頭，此事可行。',
      '得聖筊者，天時地利人和，可放心前行。',
      '神明賜聖筊，所求之事順遂如意。'
    ]
  },
  xiao: {
    name: '笑筊',
    color: '#C5A059',
    icon: '🟡',
    messages: [
      '神明微笑，未置可否，請再誠心請示。',
      '笑筊！神明覺得有趣，或許時機未到。',
      '神明笑而不答，請重新整理思緒再問。',
      '笑筊降臨，所求之事尚需三思而行。'
    ]
  },
  yin: {
    name: '陰筊',
    color: '#555555',
    icon: '⚫',
    messages: [
      '陰筊！神明搖頭，此事暫不可行，宜另謀他途。',
      '得陰筊者，時運未至，請耐心等待。',
      '神明示警，此事有阻礙，建議重新評估。',
      '陰筊降臨，所求之事不宜強求，順其自然為上。'
    ]
  }
};

function openJiaobeiModal(templeId) {
  jiaobeiState.currentTempleId = templeId;
  jiaobeiState.isThrowing = false;

  const temple = TEMPLE_DATA.find(t => t.id === templeId);
  const modal = document.getElementById('jiaobei-modal');
  const templeNameEl = document.getElementById('jiaobei-temple-name');
  const throwBtn = document.getElementById('jiaobei-throw-btn');
  const resultEl = document.getElementById('jiaobei-result');
  const hintEl = document.getElementById('jiaobei-hint');
  const leftPiece = document.getElementById('jiaobei-left');
  const rightPiece = document.getElementById('jiaobei-right');

  if (!modal || !temple) return;

  templeNameEl.textContent = `向${temple.name.split(' ')[1] || temple.name}請示`;

  // Reset state
  throwBtn.disabled = false;
  resultEl.innerHTML = '<p class="text-sm text-stone-400 font-serif" id="jiaobei-hint">凝神靜氣，心中默念所求之事…</p>';

  // Reset piece classes
  leftPiece.className = 'jiaobei-piece jiaobei-idle-left';
  leftPiece.querySelector('.jiaobei-inner').className = 'jiaobei-inner';
  rightPiece.className = 'jiaobei-piece jiaobei-idle-right';
  rightPiece.querySelector('.jiaobei-inner').className = 'jiaobei-inner';

  // Show modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeJiaobeiModal() {
  const modal = document.getElementById('jiaobei-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function throwJiaobei() {
  if (jiaobeiState.isThrowing) return;
  jiaobeiState.isThrowing = true;

  const throwBtn = document.getElementById('jiaobei-throw-btn');
  const resultEl = document.getElementById('jiaobei-result');
  const leftPiece = document.getElementById('jiaobei-left');
  const rightPiece = document.getElementById('jiaobei-right');
  const leftInner = leftPiece.querySelector('.jiaobei-inner');
  const rightInner = rightPiece.querySelector('.jiaobei-inner');

  throwBtn.disabled = true;
  resultEl.innerHTML = '';

  // Reset faces
  leftInner.className = 'jiaobei-inner';
  rightInner.className = 'jiaobei-inner';

  // Start throw animation
  leftPiece.className = 'jiaobei-piece jiaobei-throw-left';
  rightPiece.className = 'jiaobei-piece jiaobei-throw-right';

  // Determine result after animation
  setTimeout(() => {
    const roll = Math.random();
    let result;
    if (roll < 0.50) {
      result = 'sheng';
    } else if (roll < 0.75) {
      result = 'xiao';
    } else {
      result = 'yin';
    }

    const resultData = JIAOBEI_RESULTS[result];
    jiaobeiState.totalThrows++;
    jiaobeiState.streak[result]++;

    // Apply result face states
    if (result === 'sheng') {
      // One flat, one round
      leftInner.className = 'jiaobei-inner jiaobei-flat';
    } else if (result === 'xiao') {
      // Both flat
      leftInner.className = 'jiaobei-inner jiaobei-flat';
      rightInner.className = 'jiaobei-inner jiaobei-flat';
    }
    // yin: both stay round (default)

    // Settle animation
    leftPiece.className = `jiaobei-piece jiaobei-result-${result} jiaobei-left-settle`;
    rightPiece.className = `jiaobei-piece jiaobei-result-${result} jiaobei-right-settle`;

    // Show result text after settle
    setTimeout(() => {
      const message = resultData.messages[Math.floor(Math.random() * resultData.messages.length)];

      resultEl.innerHTML = `
        <div class="jiaobei-result-text" style="color: ${resultData.color}">
          ${resultData.icon} 『${resultData.name}』
        </div>
        <div class="jiaobei-result-desc">
          ${message}
        </div>
        <div class="jiaobei-streak">
          累計 ${jiaobeiState.totalThrows} 擲：聖筊 ${jiaobeiState.streak.sheng} ｜ 笑筊 ${jiaobeiState.streak.xiao} ｜ 陰筊 ${jiaobeiState.streak.yin}
        </div>
      `;

      // Re-enable throw button
      throwBtn.disabled = false;
      jiaobeiState.isThrowing = false;
    }, 600);
  }, 1300);
}

// Initialize Jiaobei Modal Events
function setupJiaobei() {
  const throwBtn = document.getElementById('jiaobei-throw-btn');
  const closeBtn = document.getElementById('jiaobei-close-btn');
  const modal = document.getElementById('jiaobei-modal');

  if (throwBtn) {
    throwBtn.addEventListener('click', throwJiaobei);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeJiaobeiModal);
  }
  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeJiaobeiModal();
      }
    });
  }
}

// =============================================
// 10. 靈籤解惑閣 (Fortune Telling) System
// =============================================

// Fortune Poem Database - 28 poems from traditional 籤詩
const FORTUNE_POEMS = [
  {
    id: 1,
    title: "第一籤　甲甲　大吉",
    lines: "巍巍獨步向雲間\n玉殿千官第一班\n富貴榮華天付汝\n福如東海壽如山",
    meaning: "上上大吉之籤。此籤象徵龍騰九天、萬事亨通。心中所求之事，時運正盛，貴人暗助，宜趁勢而為。",
    advice: {
      career: "轉職跳槽正是良機，新環境必有貴人提攜。創業者近期可得貴人資金挹注。",
      love: "良緣已近，單身者三個月內必有佳音。已婚者感情和睦，可考慮增添家庭新成員。",
      study: "考運正旺，金榜題名在望。唯需戒驕戒躁，穩紮穩打。",
      health: "身體漸入佳境，舊疾有痊癒之兆。注意飲食均衡即可。",
      wealth: "正財偏財皆旺，投資理財可積極布局。"
    },
    food: "拜完神明，到附近老街吃碗傳統滷肉飯配一碗排骨湯，象徵『福氣滿碗，財源廣進』。"
  },
  {
    id: 2,
    title: "第二籤　甲乙　上吉",
    lines: "盈虛消息總天時\n自此君當百事宜\n若問前程歸縮地\n更須方寸好修為",
    meaning: "上吉之籤。天地運行自有其時，籤示善信需耐心等待時機成熟。目前雖有小阻，但大局向好。",
    advice: {
      career: "目前工作穩固，不宜貿然異動。三個月後會有更好的轉職機會出現。",
      love: "感情需時間醞釀，勿急於表白。已有對象者，攜手共渡平淡期即是幸福。",
      study: "學業需持之以恆，勿因一時挫折而氣餒。根基打穩，大考自能發揮。",
      health: "注意季節交替時的小病痛。養生之道貴在堅持，勿三天打魚兩天曬網。",
      wealth: "財運平穩，適合長期儲蓄或定期定額投資。勿貪圖短期暴利。"
    },
    food: "求籤後到廟口吃碗熱騰騰的米粉湯，配上一盤燙青菜，清清淡淡養心性。"
  },
  {
    id: 3,
    title: "第三籤　甲丙　中吉",
    lines: "衣食自然生處有\n勸君不用苦勞心\n但能孝悌存忠信\n福祿來成禍不侵",
    message: "中吉之籤。籤意告訴你：命中本有安排，無需過度憂慮。只要保持善良正直之心，福報自來。",
    advice: {
      career: "現狀雖不盡如意，但安分守己即是最好策略。勿羨慕他人捷徑。",
      love: "真誠待人，緣分自會在最適當的時機出現。不需強求或委屈自己。",
      study: "讀書貴在明理，不在分數高低。保持求知之心，成績自然進步。",
      health: "心理健康比身體健康更需要關注。壓力大時，找信任之人傾訴。",
      wealth: "財富不求自來，節流比開源更重要。近期不宜大額投資。"
    },
    food: "拜完後到老街買一包傳統花生糖，邊走邊吃，簡單滋味最是滿足。"
  },
  {
    id: 4,
    title: "第四籤　甲丁　下吉",
    lines: "去年百事頗相宜\n今日行藏卻自疑\n若要營為須著力\n此心無愧鬼神知",
    meaning: "下吉之籤。過去順遂，如今卻遇瓶頸。籤示：此時不宜輕舉妄動，需三省吾身，再重新出發。",
    advice: {
      career: "工作遇到瓶頸或小人，此時宜低調行事、充實自我，等待翻身時機。",
      love: "感情目前處於低潮，或有誤會未解。建議冷靜溝通，勿意氣用事。",
      study: "學習遇到撞牆期，換個讀書方法或環境，會有意想不到的突破。",
      health: "身體發出警訊，勿輕忽小毛病。建議做一次全身健康檢查。",
      wealth: "財運低迷，保守為宜。勿借貸、勿作保、勿投機。"
    },
    food: "求完籤心情或許有些低落，到廟口吃碗甜湯圓，藉著甜味撫慰心靈，明天又是新的一天。"
  },
  {
    id: 5,
    title: "第五籤　甲戊　中平",
    lines: "子有三般不自由\n門庭蕭索冷如秋\n若逢牛鼠交承日\n萬事回春不用憂",
    meaning: "中平之籤。目前處於困頓之中，諸事不順。但籤示：時運即將轉變，黎明前的黑暗最是難熬。",
    advice: {
      career: "職場上感覺有志難伸。建議再堅持一陣子，農曆年後將有轉機。",
      love: "感情空窗或冷淡期。籤示等待時機，冬天過後春天自來。",
      study: "學業壓力大，但勿放棄。關鍵時刻的堅持，往往迎來意想不到的好結果。",
      health: "身心俱疲，需要好好休息。建議安排一趟小旅行，轉換心情。",
      wealth: "目前財運不彰，但並非無望。節儉渡日，等待轉機。"
    },
    food: "到廟口吃一碗熱熱的麻油雞，驅走一身寒氣，暖了胃也暖了心。"
  },
  {
    id: 6,
    title: "第六籤　甲己　大吉",
    lines: "投身岩下飼於菟\n須是還他大丈夫\n不必人人如我願\n但求事事自心舒",
    meaning: "大吉之籤。籤示善信有承擔大任之魄力，無需在意外人眼光。順心而為，天必佑之。",
    advice: {
      career: "有獨當一面的機會，勇敢承擔。主管或客戶對你信任有加。",
      love: "自信即是魅力。做真實的自己，自然吸引對的人。",
      study: "學習能力正處巔峰狀態，可挑戰更高難度的目標。",
      health: "體能狀態良好，適合開始新的運動習慣。",
      wealth: "財運上升，可考慮主動爭取加薪或開發副業。"
    },
    food: "求得好籤，到廟口點一碗牛肉麵，大塊吃肉、大口喝湯，痛快慶祝一番。"
  },
  {
    id: 7,
    title: "第七籤　甲庚　中吉",
    lines: "仙風道骨本天生\n又遇仙宗為主盟\n指日丹成謝巖谷\n一朝引領向天行",
    meaning: "中吉之籤。善信天生資質不凡，但需遇伯樂方能大展長才。籤示近期將有機緣遇貴人。",
    advice: {
      career: "有望遇到賞識你的貴人上司。準備好你的履歷和作品，機會隨時降臨。",
      love: "透過朋友或同事介紹，有機會認識優質對象。勿排斥相親安排。",
      study: "適合找一位好老師或學長姐指點迷津。有人引路，事半功倍。",
      health: "若有長期困擾的身體問題，可尋求第二意見的醫療諮詢。",
      wealth: "貴人帶財，人脈即是錢脈。多參加聚會交流。"
    },
    food: "拜完去找間老字號茶館，喝一壺好茶，說不定貴人就在隔壁桌。"
  },
  {
    id: 8,
    title: "第八籤　甲辛　上吉",
    lines: "多年枯木再開花\n且看今朝景物華\n自有貴人多著力\n何須門外問天涯",
    meaning: "上吉之籤。枯木逢春，象徵善信正走出低潮，迎來嶄新氣象。過去的努力即將開花結果。",
    advice: {
      career: "長期的付出即將被看見，升遷或轉正機會就在眼前。老客戶或舊同事可能帶來好消息。",
      love: "舊情復燃或從朋友升格為戀人的機會很大。敞開心胸接受改變。",
      study: "過去卡關的科目或技能，會突然開竅。堅持下去，曙光在前。",
      health: "長期的身體調養將見成效，精神氣色明顯好轉。",
      wealth: "過去投資或借出的錢，有望回收。財務狀況開始回穩。"
    },
    food: "春天求此籤最應景，拜完到市場買一袋新鮮水果，回家與家人分享，『開花結果』好兆頭。"
  },
  {
    id: 9,
    title: "第九籤　甲壬　中平",
    lines: "望渠消息向長安\n常把菱花仔細看\n見說文書將入境\n今朝喜色上眉端",
    meaning: "中平之籤。善信正等待某個重要消息或結果，內心忐忑。籤示：好消息即將到來，請保持耐心。",
    advice: {
      career: "面試結果或專案審核即將出爐，結果偏向正面。在等待期間，先做好準備工作。",
      love: "暗戀或曖昧中的對象，近期可能有明確的回應。做好心理準備迎接答案。",
      study: "考試成績或申請結果即將公布。籤示結果不差，勿過度擔憂。",
      health: "等待的檢查報告結果偏向良性，放寬心等待。",
      wealth: "申請的貸款或補助有核准機會。近期注意郵件或通知。"
    },
    food: "等待消息的時刻最是磨人。到廟口買一份車輪餅，紅豆餡的甜，奶油餡的香，邊吃邊等好運來。"
  },
  {
    id: 10,
    title: "第十籤　甲癸　下下",
    lines: "花開結子一半枯\n可惜今年汝虛度\n漸漸日落西山去\n勸君不必問前途",
    meaning: "下下之籤。籤示目前時運不濟，今年難有重大突破。但並非絕望，而是提醒善信韜光養晦，等待來年。",
    advice: {
      career: "今年不宜重大變動或創業。安分守己、充實專業能力，明年才有翻轉機會。",
      love: "今年感情運低迷，強求反而不美。不如專注自我成長，緣分來年自來。",
      study: "今年學習成效不彰，不宜給自己過高期待。把基礎打穩就好。",
      health: "身體狀況需多加留意，尤其慢性病患者。定期回診不可偷懶。",
      wealth: "財運不佳，今年宜守不宜攻。大筆消費或投資能免則免。"
    },
    food: "求到下下籤不必沮喪。到廟口吃碗蚵仔麵線，小小的蚵仔也有一片天，人生總有起落。"
  },
  {
    id: 11,
    title: "第十一籤　乙甲　大吉",
    lines: "靈雞漸漸見分明\n凡事且看子丑寅\n雲開月出照天下\n郎君即便見太平",
    meaning: "大吉之籤。迷霧即將散去，真相即將浮現。善信心中困擾多時之事，近日將豁然開朗。",
    advice: {
      career: "職場上的小人或誤會即將化解。清者自清，不需多做辯解，時間會證明一切。",
      love: "感情中的誤解即將消除。若與伴侶冷戰中，近期有一方會先破冰。",
      study: "困擾許久的學業難題將找到解答。考試時靈感湧現，思路清晰。",
      health: "病因即將查明，對症下藥後恢復迅速。",
      wealth: "前陣子的金錢糾紛或損失有機會得到補償或解決。"
    },
    food: "雲開見月，心情大好。到廟口吃一盤臭豆腐，那股暢快，就像真相大白的爽快感。"
  },
  {
    id: 12,
    title: "第十二籤　乙乙　中吉",
    lines: "營為期望在春前\n誰料秋來又不然\n直遇丙丁方有得\n不必勞心在目前",
    meaning: "中吉之籤。計畫趕不上變化，原本預期的成果延遲了。籤示：時機未到，勿強求，轉機在下一季。",
    advice: {
      career: "期待的升遷或專案延遲了，但不代表失敗。做好準備，機會在下一季到來。",
      love: "感情進展不如預期，但並非無望。給彼此多一點時間和空間。",
      study: "考試或申請的結果可能不如預期，但有補考或二次申請的機會。",
      health: "康復速度比預期慢，但方向是對的。繼續配合治療，勿急躁。",
      wealth: "投資回收比預期慢，暫勿變動。等待市場回穩。"
    },
    food: "等不到春天就吃夏天吧。到廟口吃一碗芒果冰或紅豆牛奶冰，清涼降火，耐心等待屬於你的季節。"
  },
  {
    id: 13,
    title: "第十三籤　乙丙　中平",
    lines: "君今庚甲未亨通\n且向江頭作釣翁\n玉兔重生應發跡\n萬人頭上逞英雄",
    meaning: "中平之籤。目前時運未通，宜暫且低調。籤示：月圓之後（約半個月到一個月），運勢將回轉。",
    advice: {
      career: "現在不是爭出頭的時候。先觀察局勢、累積實力，一個月後再行動。",
      love: "與其主動出擊，不如先提升自我魅力。最好的獵人，往往以獵物的姿態出現。",
      study: "暫時的成績落後不用氣餒。改變讀書策略，下個月會有明顯進步。",
      health: "養生需順應時節。近期宜早睡早起，調整作息。",
      wealth: "短期內財運平淡。學習理財知識，比急著投資更重要。"
    },
    food: "學學江邊釣翁的從容。到廟口點一碗魚湯，細品鮮甜，悠哉等待運勢回春。"
  },
  {
    id: 14,
    title: "第十四籤　乙丁　大吉",
    lines: "宛如仙鶴出樊籠\n脫卻羈縻處處通\n南北東西無障礙\n任君直上九霄中",
    meaning: "大吉之籤。象徵善信即將掙脫束縛，獲得前所未有的自由與機會。如仙鶴出籠，天地任翱翔。",
    advice: {
      career: "換工作的最佳時機！大膽投遞履歷或接受挖角，新環境讓你如魚得水。",
      love: "單身者即將結束空窗期。已有對象但感情不順者，分手或許是解脫，海闊天空。",
      study: "擺脫舊有學習框架，嘗試新方法會有爆發性進步。出國留學或交換機會很大。",
      health: "長期的病痛或不適即將解除。改變生活習慣，身心都將獲得新生。",
      wealth: "財路大開，尤其異地或國際相關的財源。考慮拓展海外業務或投資。"
    },
    food: "脫困而出，當然要慶祝！到廟東夜市吃一頓豐盛的，從第一攤吃到最後一攤，自由滋味最可貴。"
  },
  {
    id: 15,
    title: "第十五籤　乙戊　上吉",
    lines: "兩家門戶各相當\n不是姻緣莫較量\n直待春風好消息\n卻調琴瑟向蘭房",
    meaning: "上吉之籤。此籤專指人際關係與感情。籤示：真緣分經得起考驗，強求的緣分終究不長久。",
    advice: {
      career: "與同事或合作夥伴的關係將有明確發展。合則來，不合則去，無需強求。",
      love: "此籤對感情極其靈驗。雙方若真心相待，春天將傳佳音。若一方勉強，及早放手。",
      study: "適合與志同道合的同學組成讀書會，互相砥礪效果加倍。",
      health: "人際壓力是影響健康的主因。遠離消耗你的人，身心自然輕盈。",
      wealth: "合作投資需審慎評估夥伴。籤示選擇與自己價值觀相近的人合作。"
    },
    food: "問感情得此籤，到廟口吃一碗紅豆湯圓，祈求月老牽線，春風送暖入蘭房。"
  },
  {
    id: 16,
    title: "第十六籤　乙己　下吉",
    lines: "官事悠悠難辨明\n不如息了且歸耕\n旁人煽惑君休聽\n此去無凶亦不驚",
    meaning: "下吉之籤。身邊有小人挑撥是非。籤示：與其據理力爭消耗自己，不如暫時退讓，清白自會顯現。",
    advice: {
      career: "辦公室政治或同儕競爭讓你心煩。建議暫不回應流言蜚語，專注做好本職工作。",
      love: "感情中可能有第三者介入或親友閒言閒語。相信伴侶，勿讓外人影響關係。",
      study: "同學間的競爭比較讓你壓力大。專注自己的進度，勿被他人的成績影響心情。",
      health: "壓力導致失眠或腸胃不適。遠離是非之人，就是最好的養生。",
      wealth: "勿相信來路不明的投資訊息或快速致富方案。守住本金就是贏。"
    },
    food: "小人退散！到廟口吃碗豬腳麵線，去霉運、轉運氣，吃完整個人清爽乾淨。"
  },
  {
    id: 17,
    title: "第十七籤　乙庚　中吉",
    lines: "求名從此是亨衢\n求利剛逢是利區\n但許心田常好持\n神明自然暗相扶",
    meaning: "中吉之籤。名利之門已為你開啟，但籤示最重要的關鍵在於「心正」。心術不正者，得而復失。",
    advice: {
      career: "有升職或受到重用的機會。但需保持謙虛，勿得意忘形。位高權重時更需謹言慎行。",
      love: "好的對象出現了，但需以真誠之心相待。若只是玩玩，終將一場空。",
      study: "智慧已開，學習效率大幅提升。但勿因此投機取巧，考試作弊得不償失。",
      health: "身體狀況良好。但勿因此放縱熬夜或暴飲暴食。",
      wealth: "賺錢機會來了。但取之有道，不義之財終將加倍奉還。"
    },
    food: "求得好機會，到廟口吃個刈包，『包』住好運，『包』住財富，更要『包』住善良的心。"
  },
  {
    id: 18,
    title: "第十八籤　乙辛　大吉",
    lines: "金烏西墜兔東昇\n日夜循環古自今\n僧道得之無不利\n工商農士各開心",
    meaning: "大吉之籤。日月運行，天地有序。籤示：各行各業、各色人等，凡心懷正念者，皆能得其所願。",
    advice: {
      career: "無論你從事什麼行業，近期都有好運降臨。保持專業操守，機會自動找上門。",
      love: "無論你的身分背景如何，真愛不看條件。保持自信，愛情會在最好的時刻到來。",
      study: "無論你的起跑點在哪，努力就會有回報。不要跟別人比，跟自己比。",
      health: "健康狀況穩定。保持良好的生活習慣，身強體健百病不侵。",
      wealth: "收入穩定增長。無論正職或副業，只要腳踏實地，財富慢慢累積。"
    },
    food: "普籤大吉，適合到廟口吃一碗綜合湯，什麼料都有一點，象徵『樣樣圓滿』。"
  },
  {
    id: 19,
    title: "第十九籤　乙壬　中平",
    lines: "嗟子從來未得時\n今年星運暗相隨\n只宜守舊休貪快\n自有神明暗扶持",
    meaning: "中平之籤。運勢低迷之時，切忌躁進。籤示：神明暗中守護著你，只是時機未到。",
    advice: {
      career: "今年不宜換工作或創業。在原崗位上穩紮穩打，神明自會安排出路。",
      love: "感情暫無大進展，但也不會有重大問題。平淡也是一種福氣。",
      study: "成績雖不突出，但穩定進步。神明保佑，考試時不會有意外的差錯。",
      health: "身體狀況平平。注意小病小痛，但大病不會找上門。",
      wealth: "財運普通。神明說：不要亂投資，平安就是福。"
    },
    food: "平淡的日子也有平淡的幸福。到廟口吃一碗清粥小菜，簡簡單單，神明暗中保佑，足矣。"
  },
  {
    id: 20,
    title: "第二十籤　乙癸　上吉",
    lines: "當春久雨喜初晴\n玉兔金烏漸漸明\n舊事已成新事遂\n看看一跳入蓬瀛",
    meaning: "上吉之籤。久雨初晴，壞運已過。善信之前的困擾將一一解除，有如雨後天晴，萬物清新。",
    advice: {
      career: "工作上的障礙即將清除。之前卡關的專案或難搞的客戶，近日內會有正向轉變。",
      love: "感情上的陰霾一掃而空。與伴侶重修舊好，或終於放下過去、迎接新戀情。",
      study: "學業成績將有明顯進步。之前的努力開始見效，繼續保持。",
      health: "身體康復速度加快。心情愉悅，本身就是最好的良藥。",
      wealth: "財務狀況開始好轉。之前的債務或虧損，有望在近期獲得緩解。"
    },
    food: "雨過天晴，最適合吃一碗色彩繽紛的水果冰。人生也是一樣，苦盡甘來，滋味更甜。"
  },
  {
    id: 21,
    title: "第廿一籤　丙甲　大吉",
    lines: "十方佛法有靈通\n大難禍患不相同\n紅日當空常照耀\n還有貴人到家堂",
    meaning: "大吉之籤。神明法力無邊，大難之後必有後福。貴人即將出現在你的生活中。",
    advice: {
      career: "工作上的貴人可能是意想不到的人：或許是競爭對手、或許是點頭之交。保持善良與開放。",
      love: "愛情上的貴人可能是朋友或長輩的介紹。不要排斥他人的好意安排。",
      study: "學習上的貴人可能是素未謀面的網友或學長姐。主動請教，受益良多。",
      health: "健康有神明庇佑，大難不死必有後福。感恩現在擁有的一切。",
      wealth: "財務上的貴人即將出現，可能是一筆意外收入或他人的資助。"
    },
    food: "貴人臨門，準備好茶點招待。到廟口買一盒傳統糕餅，拜完神明帶回家，與貴人結善緣。"
  },
  {
    id: 22,
    title: "第廿二籤　丙乙　中吉",
    lines: "欲去長江水闊茫\n行舟把定未遭風\n戶內用心再作福\n看看魚水得相逢",
    meaning: "中吉之籤。前途看似茫茫，但船隻尚穩。籤示：先在家中做好準備，機會來臨時才能把握。",
    advice: {
      career: "想轉職但方向不明。先充實履歷、考取證照、建立人脈，準備好再出發。",
      love: "感情暫無對象也不必驚慌。先把自己過好，對的人自然會被你的光芒吸引。",
      study: "學習方向感到迷惘。建議多方嘗試，找到真正有熱情的領域再深耕。",
      health: "身體的小毛病來自生活習慣。從居家環境開始改善，健康慢慢回來。",
      wealth: "財運普通但不差。先把家裡的財務整理清楚，錢財才會『魚水相逢』。"
    },
    food: "在家修身養性，也不妨自己下廚。到廟口市場買些新鮮食材，煮一桌家常菜，溫暖自己。"
  },
  {
    id: 23,
    title: "第廿三籤　丙丙　上吉",
    lines: "花開花謝在春風\n貴賤窮通百歲中\n羨子傳家金紫貴\n須知積善在陰功",
    meaning: "上吉之籤。富貴榮華如花開花謝，真正的福報來自於積善行德。籤示：你或你的祖先積有陰德，福報將至。",
    advice: {
      career: "你的努力已經被看見，升遷或加薪機會很大。但勿忘初心，繼續正直做人。",
      love: "善良的人終會遇到善良的伴侶。你的真誠是最大的魅力。",
      study: "天道酬勤，你的努力不會白費。考運來自平日累積的實力。",
      health: "平日注重養生、與人為善，身體自然健康。繼續保持。",
      wealth: "財富來自福報。多做善事、幫助他人，財運自然亨通。"
    },
    food: "積善之家慶有餘，到廟口吃一碗料多味美的『佛跳牆』（或什錦羹），象徵福報滿滿。"
  },
  {
    id: 24,
    title: "第廿四籤　丙丁　下吉",
    lines: "一春萬事苦憂煎\n夏裏營求始自然\n更遇秋成冬至後\n騎馬加鞭不著鞭",
    meaning: "下吉之籤。上半年諸事不順、心情苦悶。籤示：撐過春夏，秋冬自有轉機，屆時不需鞭策也能前行。",
    advice: {
      career: "上半年的工作壓力讓你喘不過氣。下半年會有轉機，屆時一切自然順遂。",
      love: "感情的低潮期正在進行中。秋後會有轉折，冬天將迎來溫暖。",
      study: "學習上的挫折感將在上半年達到高峰。下半年開竅，成績自然進步。",
      health: "身心狀況上半年較差。注意季節轉換時保養，下半年會好轉。",
      wealth: "上半年的財務壓力較大。撐過去，下半年有轉機。"
    },
    food: "苦盡甘來，冬天最適合吃火鍋。到廟口找間羊肉爐或薑母鴨，暖身也暖心。"
  },
  {
    id: 25,
    title: "第廿五籤　丙戊　中平",
    lines: "寅午戍年多阻滯\n從今漸漸出塵埃\n若遇馬牛些子事\n不妨且退待時來",
    meaning: "中平之籤。今年（虎馬狗年）阻礙較多，但塵埃即將落定。籤示：遇到與牛馬相關的小事時，退一步海闊天空。",
    advice: {
      career: "今年職場上小人較多。建議以退為進，鋒芒內斂。少說多做，明哲保身。",
      love: "感情上容易因小事起爭執。退一步想想對方的好，吵架解決不了問題。",
      study: "今年考試運平平，但非全無機會。準備充足，考場上自然有神明暗助。",
      health: "今年身體較容易出狀況。定期運動、健康檢查，防患未然。",
      wealth: "今年財運平平。保守理財，勿輕易嘗試高風險投資。"
    },
    food: "今年凡事求穩，到廟口吃一碗鹹粥，平淡中見真味。阿嬤說：『吃粥的人，福氣長。』"
  },
  {
    id: 26,
    title: "第廿六籤　丙己　大吉",
    lines: "選出牡丹第一枝\n勸君折取莫遲疑\n世間若問相知處\n萬事逢春正及時",
    meaning: "大吉之籤。機會就在眼前，如牡丹盛開。籤示：猶豫就會錯過，把握當下、即刻行動！",
    advice: {
      career: "絕佳的工作機會或升遷機會已經出現，不要再猶豫，勇敢接下挑戰。",
      love: "命中注定的對象已經出現，不要因為害羞或猶豫而錯過。行動吧！",
      study: "最佳的學習時機就是現在。不要等到明天，今天就開始行動。",
      health: "身體給予你行動的信號。現在開始運動、調整飲食，不要等。",
      wealth: "投資或創業的最佳時機就在當下。做好功課後，勇敢進場。"
    },
    food: "機會不等人，就像剛出爐的胡椒餅，燙手也要趁熱吃，冷了就不香了。到廟口買一個，邊吃邊行動！"
  },
  {
    id: 27,
    title: "第廿七籤　丙庚　中吉",
    lines: "世間萬物各有主\n一粒一毫君莫取\n英雄豪傑自天生\n也須步步循規矩",
    meaning: "中吉之籤。不屬於你的東西，強求無用。籤示：就算天賦過人，仍需腳踏實地、一步一腳印。",
    advice: {
      career: "勿羨慕他人的成就或位置。專注自己的長處，穩步前進，終有出頭天。",
      love: "不屬於你的感情，放手也是一種智慧。對的人，不需要你委屈自己。",
      study: "學習沒有捷徑。腳踏實地讀好每一頁，成績自然好。",
      health: "健康沒有速成方案。每天堅持一點點，比偶爾激烈運動更有用。",
      wealth: "不義之財不可取。腳踏實地賺的錢，花得心安理得。"
    },
    food: "一步一腳印，就像廟口老師傅的手工豆花。慢工出細活，每一口都是真功夫。來一碗，品味『踏實』的滋味。"
  },
  {
    id: 28,
    title: "第廿八籤　丙辛　上吉",
    lines: "於今此景正亨通\n千里程途一線通\n凡百事謀皆遂意\n更須積善報蒼穹",
    meaning: "上吉之籤。萬事亨通、心想事成。籤示：好運當頭之際，更需感恩惜福、積德行善。",
    advice: {
      career: "工作順風順水，所求皆得。但勿因此驕傲，保持謙虛才能守住好運。",
      love: "感情甜蜜，兩情相悅。珍惜眼前人，常懷感恩之心。",
      study: "學業成績優異。可考慮擔任家教或幫助同學，教學相長更上層樓。",
      health: "身體健康、精神飽滿。不妨開始新的運動或興趣，拓展生活。",
      wealth: "正財偏財皆旺。賺錢之餘，記得多做公益、回饋社會。"
    },
    food: "好運連連，到廟口辦一桌『滿漢全席』（其實就是小吃點滿桌），感謝神明庇佑，也與親友分享喜悅。"
  }
];

let fortuneState = {
  isDrawing: false
};

function getDeityName(templeId) {
  const temple = TEMPLE_DATA.find(t => t.id === templeId);
  if (!temple) return '神明';
  const d = temple.main_deity;
  if (/天上聖母|媽祖/.test(d)) return '天上聖母';
  if (/關聖帝君/.test(d)) return '關聖帝君';
  if (/文昌帝君/.test(d)) return '文昌帝君';
  if (/保生大帝/.test(d)) return '保生大帝';
  if (/觀世音菩薩/.test(d)) return '觀世音菩薩';
  if (/玉皇上帝/.test(d)) return '玉皇上帝';
  if (/巧聖仙師|魯班/.test(d)) return '巧聖仙師';
  if (/福德正神/.test(d)) return '福德正神';
  if (/五路財神|趙公明/.test(d)) return '五路財神';
  return d.split('(')[0].trim();
}

function detectQuestionType(question) {
  if (!question) return 'general';
  if (/工作|轉職|職場|升遷|創業|事業|老闆|同事|求職|跳槽|面試/.test(question)) return 'career';
  if (/感情|戀愛|愛情|男友|女友|對象|結婚|分手|複合|姻緣|暗戀|曖昧|告白/.test(question)) return 'love';
  if (/考試|讀書|功名|課業|成績|學習|留學|申請|國考|檢定|證照/.test(question)) return 'study';
  if (/健康|生病|身體|病症|開刀|手術|復健|失眠|頭痛|感冒|治療/.test(question)) return 'health';
  if (/金錢|財運|投資|理財|賺錢|薪水|加薪|存款|負債|還款/.test(question)) return 'wealth';
  return 'general';
}

function setupFortune() {
  const select = document.getElementById('fortune-temple-select');
  const drawBtn = document.getElementById('draw-fortune-btn');
  const resultPanel = document.getElementById('fortune-result');
  const placeholder = document.getElementById('fortune-placeholder');

  if (!select || !drawBtn) return;

  // Populate temple dropdown
  TEMPLE_DATA.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${t.name}（${t.main_deity.split('(')[0].trim()}）`;
    select.appendChild(opt);
  });

  // Show placeholder, hide result
  if (placeholder) placeholder.classList.remove('hidden');
  if (resultPanel) resultPanel.classList.add('hidden');

  drawBtn.addEventListener('click', drawFortune);
}

function drawFortune() {
  if (fortuneState.isDrawing) return;

  const select = document.getElementById('fortune-temple-select');
  const question = document.getElementById('fortune-question')?.value?.trim();
  const templeId = select?.value;

  if (!templeId || templeId === '') {
    select?.focus();
    return;
  }

  fortuneState.isDrawing = true;

  const drawBtn = document.getElementById('draw-fortune-btn');
  const resultPanel = document.getElementById('fortune-result');
  const placeholder = document.getElementById('fortune-placeholder');

  // Shake button animation
  drawBtn.disabled = true;
  drawBtn.classList.add('shaking');

  // Hide result, show placeholder with shaking text
  if (resultPanel) resultPanel.classList.add('hidden');
  if (placeholder) {
    placeholder.classList.remove('hidden');
    placeholder.innerHTML = `
      <div class="text-4xl mb-2 opacity-50">🙏</div>
      <p class="animate-pulse">擲筊中…請稍候</p>
    `;
  }

  // Simulate shake delay then show result
  setTimeout(() => {
    drawBtn.classList.remove('shaking');

    // Pick random poem
    const poem = FORTUNE_POEMS[Math.floor(Math.random() * FORTUNE_POEMS.length)];

    // Build interpretation
    const temple = TEMPLE_DATA.find(t => t.id === templeId);
    const deityName = getDeityName(templeId);
    const qType = detectQuestionType(question);
    const advice = poem.advice[qType] || poem.advice.career;
    const templeShort = temple ? temple.name.split(' ').slice(-1)[0] : '宮廟';

    // Update title & poem
    document.getElementById('fortune-title').textContent = poem.title;
    document.getElementById('fortune-poem').innerHTML = poem.lines.replace(/\n/g, '<br>');

    // Build analysis
    document.getElementById('ai-fortune-analysis').innerHTML = `
      <div>
        <div class="fortune-section-title">【聖意指引】──${deityName}降示</div>
        <p class="fortune-section-text">${poem.meaning}</p>
      </div>
      <div>
        <div class="fortune-section-title">【依事解惑】</div>
        <p class="fortune-section-text">${advice}</p>
      </div>
      <div class="fortune-food-tip">
        🍢 <strong>【廟口解憂籤】</strong><br>${poem.food}
      </div>
    `;

    // Show result, hide placeholder
    if (placeholder) placeholder.classList.add('hidden');
    if (resultPanel) resultPanel.classList.remove('hidden');

    drawBtn.disabled = false;
    fortuneState.isDrawing = false;
  }, 1500);
}
