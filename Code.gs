// ==========================================
// 🚀 V28.26 後端核心 (基於您的正確版本 + 新增年齡功能)
// ==========================================
const CONFIG = {
  FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSes-d6muss6CY6t7q-dRs4W3zjS-yd3FY5un8v8u6bvl1FeEg/formResponse",
  ENTRY_IDS: {
    name: "entry.1566209836", phone: "entry.350610702", line: "entry.223389947",
    email: "entry.1565122495", area: "entry.1723153422", software: "entry.760670653",
    tradeCount: "entry.418594499", 
    interests: "entry.2146658620", 
    computer: "entry.231065062", agree: "entry.901071714",
    
    // 👇 新增：年齡層 ID (來自您提供的預填連結解析)
    age: "entry.1176617864"
  }
};

// ⚠️ 依據您的診斷紀錄修正後的對照表 (保留您提供的正確文字)
const MAPPING = {
  // 通訊區域
  "area_n": "北", 
  "area_c": "中", 
  "area_s": "南", 
  "area_e": "東", 
  "area_o": "離島", 

  // 交易經驗 (保留您的版本)
  "trade_1": "是的，我於任一券商近半年期權月均交易口數達 10 口以上",
  "trade_2": "目前尚未達 10 口以上，但對金融科技有強烈學習熱誠",

  // 電腦設備 (保留您的版本)
  "comp_1": "會，我會攜帶電腦與網路", 
  "comp_2": "不會",      

  // 同意聲明
  "agree_1": "我同意",

  // 興趣主題 (保留您的版本)
  "int_1": "機器學習特徵提取邏輯",
  "int_2": "多空動能趨式雷達應用",
  "int_3": "斜率與過濾盤整盤方法",
  "int_4": "低延遲數據資料視覺化",

  // 👇 新增：年齡層對照
  "age_1": "20以下",
  "age_2": "20~35",
  "age_3": "35~50",
  "age_4": "50~65",
  "age_5": "65以上"
};

function doGet(e) {
  return HtmlService.createTemplateFromFile('index').evaluate()
    .setTitle('【期貨AI數據戰情室】分享會報名表')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const formData = JSON.parse(e.postData.contents);
    const result = processFormSubmission(formData);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, msg: "後端錯誤: " + err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function processFormSubmission(formData) {
  try {
    var payload = {};
    payload[CONFIG.ENTRY_IDS.name] = String(formData.name || "").trim();
    payload[CONFIG.ENTRY_IDS.phone] = String(formData.phone || "").trim();
    payload[CONFIG.ENTRY_IDS.line] = String(formData.line || "").trim();
    payload[CONFIG.ENTRY_IDS.email] = String(formData.email || "").trim();
    payload[CONFIG.ENTRY_IDS.software] = String(formData.software || "").trim();
    
    if (formData.area && MAPPING[formData.area]) payload[CONFIG.ENTRY_IDS.area] = MAPPING[formData.area];
    if (formData.tradeCount && MAPPING[formData.tradeCount]) payload[CONFIG.ENTRY_IDS.tradeCount] = MAPPING[formData.tradeCount];
    if (formData.computer && MAPPING[formData.computer]) payload[CONFIG.ENTRY_IDS.computer] = MAPPING[formData.computer];
    if (formData.agree && MAPPING[formData.agree]) payload[CONFIG.ENTRY_IDS.agree] = MAPPING[formData.agree];

    // 👇 新增：處理年齡資料
    if (formData.age && MAPPING[formData.age]) payload[CONFIG.ENTRY_IDS.age] = MAPPING[formData.age];

    // 處理複選題 (保留系統內建其他邏輯)
    var finalInterests = [];
    var otherInterestText = ""; 

    if (Array.isArray(formData.interests)) {
      formData.interests.forEach(function(val) {
        if (val === "int_other") {
          // ⚠️ 診斷紀錄說有開啟系統「其他」，所以要送特殊代碼
          finalInterests.push("__other_option__");
          otherInterestText = String(formData.interestOtherText || "").trim();
        } else if (MAPPING[val]) {
          finalInterests.push(MAPPING[val]);
        }
      });
    }

    var params = [];
    for (var key in payload) {
      params.push(key + "=" + encodeURIComponent(payload[key]));
    }
    for (var i = 0; i < finalInterests.length; i++) {
      params.push(CONFIG.ENTRY_IDS.interests + "=" + encodeURIComponent(finalInterests[i]));
    }
    // 把其他的文字放在附屬參數裡
    if (otherInterestText) {
      params.push(CONFIG.ENTRY_IDS.interests + ".other_option_response=" + encodeURIComponent(otherInterestText));
    }

    var options = {
      "method": "post",
      "payload": params.join("&"),
      "contentType": "application/x-www-form-urlencoded",
      "muteHttpExceptions": true
    };

    var response = UrlFetchApp.fetch(CONFIG.FORM_URL, options);
    var code = response.getResponseCode();

    if (code === 200 || code === 0) {
      return { success: true };
    } else {
      return { success: false, msg: "Google 表單拒絕 (代碼 " + code + ")，請檢查選項文字。" };
    }

  } catch (error) {
    return { success: false, msg: "系統錯誤: " + error.toString() };
  }
}
