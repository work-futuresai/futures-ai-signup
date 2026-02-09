// ==========================================
// 🚀 V24.0 後端核心 (最終確認版)
// 包含：正確標題 + 複選題修復邏輯
// ==========================================
const CONFIG = {
  // 您的 Google 表單提交網址
  FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSes-d6muss6CY6t7q-dRs4W3zjS-yd3FY5un8v8u6bvl1FeEg/formResponse",
  // 各欄位的 Entry ID
  ENTRY_IDS: {
    name: "entry.1566209836",
    phone: "entry.350610702",
    software: "entry.760670653",
    tradeCount: "entry.418594499",
    interests: "entry.2146658620",
    computer: "entry.231065062",
    agree: "entry.901071714"
  }
};

// 選項對照表 (必須與 Google 表單完全一致)
const MAPPING = {
  "trade_1": "是的，我於任一券商近半年期權月均交易口數達 10 口以上",
  "trade_2": "目前尚未達到，但對金融科技有強烈學習熱誠",
  "comp_1": "可以，我會自備電腦與網路",
  "comp_2": "不方便，需再與您討論",
  "agree_1": "我同意",
  "int_1": "AI 特徵提取邏輯",
  "int_2": "動能雷達應用",
  "int_3": "走勢斜率與盤整過濾技術",
  "int_4": "低延遲金融數據視覺化看板打造"
};

function doGet(e) {
  return HtmlService.createTemplateFromFile('index').evaluate()
      // ✅ 這裡就是您指定的最終標題
      .setTitle('【期貨AI數據戰情室】講座報名表') 
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function processFormSubmission(formData) {
  try {
    var payload = {};
    
    // 1. 處理基本文字欄位
    payload[CONFIG.ENTRY_IDS.name] = String(formData.name || "").trim();
    payload[CONFIG.ENTRY_IDS.phone] = String(formData.phone || "").trim();
    payload[CONFIG.ENTRY_IDS.software] = String(formData.software || "").trim();
    
    // 2. 處理單選題 (透過對照表轉換)
    if (formData.tradeCount && MAPPING[formData.tradeCount]) payload[CONFIG.ENTRY_IDS.tradeCount] = MAPPING[formData.tradeCount];
    if (formData.computer && MAPPING[formData.computer]) payload[CONFIG.ENTRY_IDS.computer] = MAPPING[formData.computer];
    if (formData.agree && MAPPING[formData.agree]) payload[CONFIG.ENTRY_IDS.agree] = MAPPING[formData.agree];

    // 3. 處理複選題 (將代號轉為中文)
    var finalInterests = [];
    if (Array.isArray(formData.interests) && formData.interests.length > 0) {
       finalInterests = formData.interests
           .map(function(c){ return MAPPING[c]; })
           .filter(function(v){ return v; });
    }

    // 4. 發送請求 (針對複選題的特殊處理)
    var options = { "method": "post", "muteHttpExceptions": true };

    if (finalInterests.length <= 1) {
      // 如果只選一個或沒選，直接塞入 payload
      if (finalInterests.length === 1) payload[CONFIG.ENTRY_IDS.interests] = finalInterests[0];
      options.payload = payload;
    } 
    else {
      // ✅ 如果選多個，手動構建參數字串 (解決 400 錯誤的關鍵)
      var params = [];
      // 先加入其他欄位
      for (var key in payload) {
        params.push(key + "=" + encodeURIComponent(payload[key]));
      }
      // 再重複加入複選題欄位
      for (var i = 0; i < finalInterests.length; i++) {
        params.push(CONFIG.ENTRY_IDS.interests + "=" + encodeURIComponent(finalInterests[i]));
      }
      options.payload = params.join("&");
      options.contentType = "application/x-www-form-urlencoded";
    }

    // 5. 執行發送
    var response = UrlFetchApp.fetch(CONFIG.FORM_URL, options);
    
    if (response.getResponseCode() === 200) {
      return { success: true };
    } else {
      return { success: false, msg: "Google 拒絕 (代碼 " + response.getResponseCode() + ")" };
    }

  } catch (error) {
    return { success: false, msg: "系統錯誤：" + error.toString() };
  }
}