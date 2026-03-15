# 🤖 原價屋 AI 建議估價清單 (CoolPC AI Builder)

一個專為 [原價屋線上估價系統](https://www.coolpc.com.tw/evaluate.php) 設計的 Tampermonkey 使用者腳本。
透過整合 **Google Gemini** 與 **OpenAI ChatGPT**，讓 AI 根據你的「預算」、「用途」或「特定需求」，自動從當下最新的零件庫存中幫你挑選最適合的電腦組合，並**自動為你勾選網頁上的選單**！

---

## ✨ 核心功能

* **雙 AI 引擎支援**：可自由切換使用 Google Gemini (推薦 1.5 Flash/Pro) 或 OpenAI ChatGPT 系列模型。
* **即時庫存解析**：自動抓取當下網頁所有下拉選單的最新選項，不怕 AI 選到停售或缺貨的零件。
* **智慧追問與修改**：支援讀取「目前網頁已選擇」的零件。你可以隨時追問 AI：「幫我把機殼換成白色的」、「預算爆了，顯示卡降級」，AI 會保留原有零件僅做局部修改。
* **懸浮視窗設計**：畫面右下角專屬 GUI 介面，支援點擊縮小成懸浮圖示，不阻擋原價屋的估價版面。
* **模型動態搜尋**：輸入 API Key 後自動抓取可用模型列表，並支援關鍵字快速搜尋。
* **本機密鑰管理**：API Key 自動安全儲存於瀏覽器本機端（Tampermonkey 儲存空間），並提供一鍵清除按鈕。

---

## 🛠️ 安裝教學

### 步驟 1：安裝 Tampermonkey 擴充功能
依據你的瀏覽器安裝 Tampermonkey：
* [Chrome / Edge / Brave 擴充功能商店](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
* [Firefox 附加元件](https://addons.mozilla.org/zh-TW/firefox/addon/tampermonkey/)

### 步驟 2：一鍵安裝腳本
1. 點擊下方連結安裝腳本：
   👉 **[點我安裝 / 更新原價屋 AI 建議估價清單腳本](https://github.com/HrJasn/Greasyfork/raw/refs/heads/main/coolpcaichoose.user.js)**
2. 瀏覽器會自動開啟 Tampermonkey 的安裝頁面，點擊畫面上的 **「安裝 (Install)」** 或 **「更新 (Update)」** 即可完成。
   *(💡 提示：透過此連結安裝後，未來腳本若有新版本，Tampermonkey 將會自動偵測並為您更新！)*

### 步驟 3：開始使用
前往 [原價屋線上估價系統](https://www.coolpc.com.tw/evaluate.php)，你就會在右下角看到「🤖 AI配單」的懸浮圖示了！

---

## 🚀 快速上手指南

1. **申請 API Key**：
   * **Google Gemini** (免費額度高，推薦)：前往 [Google AI Studio](https://aistudio.google.com/api-keys) 申請。
   * **OpenAI ChatGPT**：前往 [OpenAI Platform](https://platform.openai.com/api-keys) 申請。
2. **輸入密鑰並載入模型**：在腳本介面貼上 API Key，點擊「🔄 驗證並載入模型列表」。
3. **輸入需求**：在文字框內輸入你的組裝需求。
   * *範例：「預算 3.5 萬，想順跑 2K 畫質的黑神話悟空，需要含正版 Windows 11，外觀想要黑色系。」*
4. **送出分析**：點擊「⚡ 送出需求並分析」，等待約 10~20 秒，AI 就會自動幫你把所有零件填入網頁選單中！

---

## ❓ 常見問題 (FAQ)

### Q1: 為什麼我在「無痕模式 / 隱私視窗」沒看到腳本？
瀏覽器預設會阻止擴充功能在無痕模式下執行。請前往瀏覽器的「擴充功能管理」頁面，找到 Tampermonkey，並將 **「在無痕模式中允許 (Allow in Incognito)」** 開啟。

### Q2: 為什麼送出後顯示「API 錯誤」或「無法解析」？
1. 請確認你的 API Key 是否有效且複製完整。
2. 有些較舊的模型 (如 Gemini 1.0 Pro 或舊版 GPT-3.5) 可能不支援強制的 JSON 格式輸出。建議選擇 `gemini-1.5-flash` 或 `gpt-4o-mini`。

### Q3: 隱私問題，我的 API Key 會傳送給誰？
腳本只會將你的 API Key 儲存在**你個人的瀏覽器本機端** (利用 Tampermonkey 的 `GM_setValue`)。API 請求是直接從你的瀏覽器發送到 Google 或 OpenAI 的官方伺服器，不會經過任何第三方中繼站。

---

## ⚠️ 免責聲明

1. 本腳本僅作為輔助選購工具，AI 的搭配建議**不保證 100% 的硬體相容性** (例如：塔散高度是否卡到機殼、顯卡長度限制等細節)。
2. 結帳前請務必再次自行確認規格，或請原價屋門市人員協助做最終確認。
3. 本腳本與「原價屋 CoolPC」官方無任何關聯，網頁結構若未來發生變動，可能會導致腳本暫時失效。