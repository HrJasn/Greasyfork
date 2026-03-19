// ==UserScript==
// @name         原價屋 AI 建議估價清單
// @namespace    https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @version      2026-03-15.13
// @description  在原價屋估價頁面讓AI自動抓取當下選項配單。新增預算防呆機制，遇不合理需求會醒目提示且不硬配單。
// @copyright    2026, HrJasn
// @license      MIT
// @author       HrJasn
// @match        *://*.coolpc.com.tw/evaluate.php
// @match        *://coolpc.com.tw/evaluate.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=coolpc.com.tw
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      generativelanguage.googleapis.com
// @connect      api.openai.com
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. 建立前端 GUI 總容器 ---
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: "Microsoft JhengHei", Arial, sans-serif;
    `;

    // --- 2. 建立縮小後的懸浮圖示 (Icon) ---
    const minimizedIcon = document.createElement('div');
    minimizedIcon.innerHTML = '🤖<br>AI配單';
    minimizedIcon.style.cssText = `
        width: 60px;
        height: 60px;
        background: linear-gradient(to bottom, #c62d1f 5%, #8a2a21 100%);
        color: white;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
        font-weight: bold;
        font-size: 12px;
        text-align: center;
        line-height: 1.2;
        transition: transform 0.2s;
        box-sizing: border-box;
    `;
    minimizedIcon.onmouseover = () => minimizedIcon.style.transform = 'scale(1.1)';
    minimizedIcon.onmouseout = () => minimizedIcon.style.transform = 'scale(1)';

    // --- 3. 建立展開後的完整視窗 (Window) ---
    const guiWindow = document.createElement('div');
    guiWindow.style.cssText = `
        width: 340px;
        background: #fff;
        border: 2px solid #8a2a21;
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        box-sizing: border-box;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;';

    const title = document.createElement('h3');
    title.innerText = '🤖 AI 組裝助手';
    title.style.cssText = 'margin: 0; color: #8a2a21; font-size: 16px; font-weight: bold; line-height: 1.2;';

    const minimizeBtn = document.createElement('button');
    minimizeBtn.innerText = '➖';
    minimizeBtn.title = '縮小視窗';
    minimizeBtn.style.cssText = `
        background: none; border: none; cursor: pointer;
        font-size: 16px; color: #555; padding: 0 5px; line-height: 1;
    `;
    minimizeBtn.onmouseover = () => minimizeBtn.style.color = '#8a2a21';
    minimizeBtn.onmouseout = () => minimizeBtn.style.color = '#555';

    header.appendChild(title);
    header.appendChild(minimizeBtn);
    guiWindow.appendChild(header);

    // --- 輔助函數：建立折疊面板 ---
    function createCollapsibleSection(titleText) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'margin-bottom: 8px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;';

        const secHeader = document.createElement('div');
        secHeader.style.cssText = 'background: #f8f8f8; padding: 8px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: bold; color: #333; user-select: none;';

        const secTitle = document.createElement('span');
        secTitle.innerText = titleText;

        const secIcon = document.createElement('span');
        secIcon.innerText = '▼';
        secIcon.style.cssText = 'font-size: 10px; transition: transform 0.2s;';

        secHeader.appendChild(secTitle);
        secHeader.appendChild(secIcon);

        const secContent = document.createElement('div');
        secContent.style.cssText = 'padding: 10px; background: #fff; border-top: 1px solid #ddd;';

        let isOpen = true;

        secHeader.addEventListener('click', () => {
            isOpen = !isOpen;
            secContent.style.display = isOpen ? 'block' : 'none';
            secIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(-90deg)';
        });

        wrapper.appendChild(secHeader);
        wrapper.appendChild(secContent);

        return {
            wrapper, content: secContent,
            collapse: () => { if (isOpen) { isOpen = false; secContent.style.display = 'none'; secIcon.style.transform = 'rotate(-90deg)'; } },
            expand: () => { if (!isOpen) { isOpen = true; secContent.style.display = 'block'; secIcon.style.transform = 'rotate(0deg)'; } }
        };
    }

    // --- 區塊 1：引擎與金鑰設定 ---
    const engineSection = createCollapsibleSection('⚙️ 引擎與金鑰設定');
    guiWindow.appendChild(engineSection.wrapper);

    const providerContainer = document.createElement('div');
    providerContainer.style.cssText = 'margin-bottom: 10px;';

    const providerLabel = document.createElement('label');
    providerLabel.innerText = '選擇 AI 引擎:';
    providerLabel.style.cssText = 'display: block; font-size: 12px; font-weight: bold; color: #555; margin-bottom: 3px;';

    const providerSelect = document.createElement('select');
    providerSelect.style.cssText = 'width: 100%; box-sizing: border-box; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';
    providerSelect.innerHTML = `<option value="gemini">Google Gemini</option><option value="openai">OpenAI ChatGPT</option>`;
    providerSelect.value = GM_getValue('ai_provider', 'gemini');

    providerContainer.appendChild(providerLabel);
    providerContainer.appendChild(providerSelect);
    engineSection.content.appendChild(providerContainer);

    const apiKeyLabelContainer = document.createElement('div');
    apiKeyLabelContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 12px;';

    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.innerText = 'API Key (本機自動儲存):';
    apiKeyLabel.style.cssText = 'color: #555; font-weight: bold;';

    const apiKeyLink = document.createElement('a');
    apiKeyLink.target = '_blank';
    apiKeyLink.style.cssText = 'color: #0066cc; text-decoration: none; font-weight: bold;';

    apiKeyLabelContainer.appendChild(apiKeyLabel);
    apiKeyLabelContainer.appendChild(apiKeyLink);
    engineSection.content.appendChild(apiKeyLabelContainer);

    const apiKeyInputWrapper = document.createElement('div');
    apiKeyInputWrapper.style.cssText = 'display: flex; gap: 5px;';

    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.style.cssText = 'flex-grow: 1; box-sizing: border-box; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';

    const clearKeyBtn = document.createElement('button');
    clearKeyBtn.innerText = '🗑️';
    clearKeyBtn.title = '清除本機儲存的 API Key';
    clearKeyBtn.style.cssText = 'padding: 6px; background: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; flex-shrink: 0; line-height: 1;';

    apiKeyInputWrapper.appendChild(apiKeyInput);
    apiKeyInputWrapper.appendChild(clearKeyBtn);
    engineSection.content.appendChild(apiKeyInputWrapper);

    // --- 區塊 2：模型連線與搜尋 ---
    const modelSection = createCollapsibleSection('🌐 模型連線與搜尋');
    guiWindow.appendChild(modelSection.wrapper);

    const loadModelsBtn = document.createElement('button');
    loadModelsBtn.innerHTML = '🔄 驗證並載入模型列表';
    loadModelsBtn.style.cssText = `
        width: 100%; box-sizing: border-box; padding: 10px; margin-bottom: 8px;
        background: #555; color: white; border: none; border-radius: 4px;
        cursor: pointer; font-weight: bold; min-height: 40px; height: auto;
        display: flex; align-items: center; justify-content: center; line-height: normal;
    `;
    modelSection.content.appendChild(loadModelsBtn);

    const modelSearchWrapper = document.createElement('div');
    modelSearchWrapper.style.display = 'none';

    const modelSearchInput = document.createElement('input');
    modelSearchInput.type = 'text';
    modelSearchInput.placeholder = '🔍 搜尋已載入的模型...';
    modelSearchInput.style.cssText = 'width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #ccc; border-radius: 4px;';
    modelSearchWrapper.appendChild(modelSearchInput);
    modelSection.content.appendChild(modelSearchWrapper);

    // --- 區塊 3：固定區域 (模型選擇、警告面板、對話與送出) ---
    const modelSelectWrapper = document.createElement('div');
    modelSelectWrapper.style.display = 'none';
    modelSelectWrapper.style.cssText = 'margin-bottom: 8px; padding-top: 5px;';

    const labelRow = document.createElement('div');
    labelRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;';

    const modelSelectLabel = document.createElement('label');
    modelSelectLabel.innerText = '當前使用模型:';
    modelSelectLabel.style.cssText = 'font-size: 12px; font-weight: bold; color: #0066cc;';

    const autoSwitchWrapper = document.createElement('label');
    autoSwitchWrapper.style.cssText = 'font-size: 12px; color: #555; display: flex; align-items: center; cursor: pointer; user-select: none;';

    const autoSwitchCheckbox = document.createElement('input');
    autoSwitchCheckbox.type = 'checkbox';
    autoSwitchCheckbox.checked = GM_getValue('auto_switch_model', true);
    autoSwitchCheckbox.style.cssText = 'margin: 0 4px 0 0; cursor: pointer;';

    autoSwitchCheckbox.addEventListener('change', (e) => {
        GM_setValue('auto_switch_model', e.target.checked);
    });

    autoSwitchWrapper.appendChild(autoSwitchCheckbox);
    autoSwitchWrapper.appendChild(document.createTextNode('失敗時自動降級重試'));

    labelRow.appendChild(modelSelectLabel);
    labelRow.appendChild(autoSwitchWrapper);

    const modelSelect = document.createElement('select');
    modelSelect.style.cssText = 'width: 100%; box-sizing: border-box; padding: 8px; border: 1px solid #0066cc; border-radius: 4px; background-color: #f0f7ff; font-weight: bold; color: #333;';

    modelSelectWrapper.appendChild(labelRow);
    modelSelectWrapper.appendChild(modelSelect);
    guiWindow.appendChild(modelSelectWrapper);

    // ★ 新增：AI 警告訊息專用面板 (預設隱藏)
    const warningBox = document.createElement('div');
    warningBox.style.cssText = 'display: none; background-color: #fff0f0; border-left: 4px solid #d02718; color: #b71c1c; padding: 10px; margin-bottom: 10px; border-radius: 4px; font-size: 13px; font-weight: bold; line-height: 1.5; word-wrap: break-word;';
    guiWindow.appendChild(warningBox);

    const promptInput = document.createElement('textarea');
    promptInput.placeholder = '請輸入您的組裝需求或追問修改（例如：預算3萬內、想順跑2077... / 或者追問：幫我把目前的機殼換成白色的）';
    promptInput.style.cssText = 'width: 100%; height: 85px; box-sizing: border-box; margin-bottom: 10px; padding: 8px; resize: none; border: 1px solid #ccc; border-radius: 4px; font-family: inherit;';

    const submitBtn = document.createElement('button');
    submitBtn.innerHTML = '⚡ 送出需求並分析';
    submitBtn.style.cssText = `
        width: 100%; box-sizing: border-box; padding: 12px;
        background: linear-gradient(to bottom, #c62d1f 5%, #f24437 100%);
        color: #fff; border: 1px solid #d02718; border-radius: 5px;
        cursor: pointer; font-weight: bold; font-size: 14px;
        min-height: 45px; height: auto; display: flex; align-items: center; justify-content: center; line-height: normal;
    `;

    const statusText = document.createElement('p');
    statusText.innerText = '狀態：請先輸入 API Key 並載入模型';
    statusText.style.cssText = 'margin: 10px 0 0 0; font-size: 12px; color: #555; word-break: break-all; line-height: 1.4;';

    guiWindow.appendChild(promptInput);
    guiWindow.appendChild(submitBtn);
    guiWindow.appendChild(statusText);

    mainContainer.appendChild(minimizedIcon);
    mainContainer.appendChild(guiWindow);
    document.body.appendChild(mainContainer);

    // --- 4. 變數與 UI 狀態切換邏輯 ---
    let isMinimized = GM_getValue('gui_is_minimized', false);
    let cachedModels = [];

    function toggleView() {
        if (isMinimized) {
            minimizedIcon.style.display = 'flex'; guiWindow.style.display = 'none';
        } else {
            minimizedIcon.style.display = 'none'; guiWindow.style.display = 'block';
        }
    }

    minimizedIcon.addEventListener('click', () => { isMinimized = false; GM_setValue('gui_is_minimized', false); toggleView(); });
    minimizeBtn.addEventListener('click', () => { isMinimized = true; GM_setValue('gui_is_minimized', true); toggleView(); });

    toggleView();

    function updateProviderUI() {
        const provider = providerSelect.value;
        GM_setValue('ai_provider', provider);

        if (provider === 'gemini') {
            apiKeyInput.value = GM_getValue('gemini_api_key', '');
            apiKeyInput.placeholder = '請貼上 Gemini API Key';
            apiKeyLink.href = 'https://aistudio.google.com/api-keys'; apiKeyLink.innerText = '申請 Gemini Key ↗';
        } else {
            apiKeyInput.value = GM_getValue('openai_api_key', '');
            apiKeyInput.placeholder = '請貼上 OpenAI API Key';
            apiKeyLink.href = 'https://platform.openai.com/api-keys'; apiKeyLink.innerText = '申請 OpenAI Key ↗';
        }

        cachedModels = [];
        modelSelect.innerHTML = '';
        modelSelectWrapper.style.display = 'none';
        modelSearchWrapper.style.display = 'none';
        warningBox.style.display = 'none'; // 切換引擎時重置警告面板
        engineSection.expand();
        modelSection.expand();

        statusText.innerText = apiKeyInput.value.trim() !== '' ? '狀態：已讀取儲存的 API Key，請點擊上方按鈕載入模型。' : '狀態：請先輸入 API Key 並載入模型';
        statusText.style.color = '#555';
    }

    providerSelect.addEventListener('change', updateProviderUI);

    clearKeyBtn.addEventListener('click', () => {
        const provider = providerSelect.value;
        if (provider === 'gemini') GM_setValue('gemini_api_key', ''); else GM_setValue('openai_api_key', '');

        apiKeyInput.value = ''; cachedModels = [];
        modelSelectWrapper.style.display = 'none'; modelSearchWrapper.style.display = 'none'; warningBox.style.display = 'none';
        statusText.innerText = `狀態：已成功清除 ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} 的 API Key。`;
        statusText.style.color = '#d02718';
    });

    updateProviderUI();

    // --- 5. 處理模型載入、動態評分與狀態標記 ---
    function renderModels(keyword = '') {
        const currentSelectedId = modelSelect.value;
        modelSelect.innerHTML = '';
        const lowerKeyword = keyword.toLowerCase();
        let matchCount = 0;

        cachedModels.forEach(m => {
            if (m.id.toLowerCase().includes(lowerKeyword) || (m.name && m.name.toLowerCase().includes(lowerKeyword))) {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.text = m.exhausted ? `⚠️ ${m.name} (失敗或受限)` : m.name;
                if (currentSelectedId) { if (m.id === currentSelectedId) opt.selected = true; }
                else { if ((m.id.includes('gemini-1.5-flash') && !m.id.includes('8b')) || m.id === 'gpt-4o-mini') opt.selected = true; }
                modelSelect.appendChild(opt);
                matchCount++;
            }
        });

        if (matchCount === 0) {
            const opt = document.createElement('option'); opt.text = '找不到符合的模型'; opt.disabled = true; modelSelect.appendChild(opt);
        }
    }

    function toggleModelExhausted(modelId, isExhausted) {
        const model = cachedModels.find(m => m.id === modelId);
        if (model && model.exhausted !== isExhausted) {
            model.exhausted = isExhausted; renderModels(modelSearchInput.value);
        }
    }

    function getNextBestModel() {
        const availableModels = cachedModels.filter(m => !m.exhausted);
        if (availableModels.length === 0) return null;

        function getModelScore(modelId) {
            let score = 0; const id = modelId.toLowerCase();
            const vMatch = id.match(/(\d+(?:\.\d+)?)/);
            if (vMatch) { let v = parseFloat(vMatch[1]); if (v > 50) v = 1; score += v * 10; } else { score += 10; }
            if (id.startsWith('o1')) score += 50; if (id.startsWith('o3')) score += 60; if (id.includes('gpt-4o')) score += 5;
            if (id.includes('turbo')) score += 2; if (id.includes('mini')) score -= 1;
            if (id.includes('ultra')) score += 3; if (id.includes('pro')) score += 2; if (id.includes('flash')) score += 1; if (id.includes('8b')) score -= 1;
            if (/\d{4}$/.test(id) || id.includes('exp')) score -= 0.5; if (id.includes('vision')) score -= 1;
            return score;
        }

        availableModels.sort((a, b) => getModelScore(b.id) - getModelScore(a.id));
        return availableModels[0].id;
    }

    loadModelsBtn.addEventListener('click', () => {
        const provider = providerSelect.value; const apiKey = apiKeyInput.value.trim();
        if (!apiKey) { statusText.innerText = '錯誤：請先輸入 API Key！'; statusText.style.color = 'red'; return; }

        statusText.innerText = '狀態：正在載入模型列表...'; statusText.style.color = '#000'; loadModelsBtn.disabled = true;

        const handleSuccess = (modelsArr) => {
            loadModelsBtn.disabled = false; cachedModels = modelsArr; renderModels('');
            modelSelectWrapper.style.display = 'block'; modelSearchWrapper.style.display = 'block';
            statusText.innerText = `狀態：成功載入 ${cachedModels.length} 個模型！您可以開始輸入需求了。`; statusText.style.color = 'green';
            engineSection.collapse(); modelSection.collapse();
        };

        if (provider === 'gemini') {
            GM_setValue('gemini_api_key', apiKey);
            GM_xmlhttpRequest({
                method: 'GET', url: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
                onload: function(response) {
                    try {
                        const res = JSON.parse(response.responseText);
                        if (res.error) throw new Error(res.error.message);
                        const models = res.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                            .map(m => ({ id: m.name, name: m.displayName ? `${m.displayName} (${m.name.replace('models/', '')})` : m.name, exhausted: false }));
                        handleSuccess(models);
                    } catch (e) { loadModelsBtn.disabled = false; statusText.innerText = `API 錯誤: ${e.message || '無法解析回應'}`; statusText.style.color = 'red'; }
                },
                onerror: () => { loadModelsBtn.disabled = false; statusText.innerText = '錯誤：API 請求失敗，請檢查網路。'; statusText.style.color = 'red'; }
            });
        } else if (provider === 'openai') {
            GM_setValue('openai_api_key', apiKey);
            GM_xmlhttpRequest({
                method: 'GET', url: 'https://api.openai.com/v1/models', headers: { 'Authorization': `Bearer ${apiKey}` },
                onload: function(response) {
                    try {
                        const res = JSON.parse(response.responseText);
                        if (res.error) throw new Error(res.error.message);
                        const models = res.data.filter(m => m.id.startsWith('gpt') || m.id.startsWith('o'))
                            .map(m => ({ id: m.id, name: m.id, exhausted: false })).sort((a, b) => b.id.localeCompare(a.id));
                        handleSuccess(models);
                    } catch (e) { loadModelsBtn.disabled = false; statusText.innerText = `API 錯誤: ${e.message || '無法解析回應'}`; statusText.style.color = 'red'; }
                },
                onerror: () => { loadModelsBtn.disabled = false; statusText.innerText = '錯誤：API 請求失敗，請檢查網路。'; statusText.style.color = 'red'; }
            });
        }
    });

    modelSearchInput.addEventListener('input', (e) => renderModels(e.target.value));

    // --- 6. 監聽送出事件與全局錯誤容忍重試邏輯 ---
    submitBtn.addEventListener('click', () => {
        const provider = providerSelect.value;
        const apiKey = apiKeyInput.value.trim();
        const prompt = promptInput.value.trim();
        let currentTargetModel = modelSelect.value;

        if (!apiKey) { statusText.innerText = '錯誤：尚未填寫 API Key！'; statusText.style.color = 'red'; return; }
        if (modelSelectWrapper.style.display === 'none' || !currentTargetModel) { statusText.innerText = '錯誤：請先載入並選擇一個模型！'; statusText.style.color = 'red'; return; }
        if (!prompt) { statusText.innerText = '錯誤：請輸入組裝需求！'; statusText.style.color = 'red'; return; }

        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        warningBox.style.display = 'none'; // 每次送出前隱藏警告面板

        try {
            const categories = {};
            const currentSelections = {};

            document.querySelectorAll('select[name^="n"]').forEach(select => {
                const options = [];
                const categoryTitle = select.options[0] ? select.options[0].text : select.name;

                Array.from(select.options).forEach(opt => {
                    if (opt.value && opt.value !== "0" && !opt.disabled) {
                        options.push({ id: opt.value, name: opt.text });
                    }
                });

                if (options.length > 0) {
                    categories[select.name] = { title: categoryTitle, items: options };
                }

                if (select.value && select.value !== "0") {
                    const selectedOpt = Array.from(select.options).find(opt => opt.value === select.value);
                    if (selectedOpt) {
                        currentSelections[select.name] = { title: categoryTitle, id: select.value, name: selectedOpt.text };
                    }
                }
            });

            // ★ 更新系統提示詞：加入預算與合理性評估任務
            const systemInstruction = `你是一個專業的電腦組裝人員。
我將會提供「使用者的需求」、「目前網頁上已選擇的零件(如果有)」以及「原價屋當下的所有零件清單 JSON」。
請依據使用者預算及用途，在清單中挑選最適合的電腦組合。

【極重要：預算與需求合理性評估】：
如果使用者的預算明顯太低，或者需求在現實中完全無法達成（例如：5000元要組能順跑3A大作的新機），請**不要**勉強配單。
此時請直接回傳一個包含 "AI_WARNING" 鍵的 JSON，Value 請填寫給使用者的白話解釋與具體建議。
範例格式：
{
  "AI_WARNING": "您的預算 10000 元無法滿足順跑 Cyberpunk 2077 的需求，建議至少將預算提高至 30000 元，或考慮二手零件。"
}

【重要任務：追問修改】：如果使用者需求是針對「目前的配單」進行修改，請你務必保留「目前已選擇零件」中不需要更動的部分，僅替換使用者要求修改的項目，並重新考量整體相容性。

【相容性極度重要】：
1. CPU 必須與主機板腳位對應。
2. 記憶體必須確保與主機板相容 (DDR4 / DDR5)。
3. 電源供應器瓦數必須足以支撐顯示卡及 CPU。
4. 如果使用者要含作業系統，務必在作業系統分類中挑選。

請回傳一個純 JSON 物件，不要有 Markdown 語法 (不要 \`\`\`json 等標籤)。
若配單成功，JSON 的 Key 必須是選單的 name (如 n1, n2)，Value 是選中的商品 id。
範例格式：
{
  "n1": "123456",
  "n2": "654321"
}
只需回傳有選到的分類即可。`;

            const userContentText = `【使用者需求】\n${prompt}\n\n【目前已選擇零件】\n${Object.keys(currentSelections).length > 0 ? JSON.stringify(currentSelections) : '尚未選擇'}\n\n【所有零件清單】\n${JSON.stringify(categories)}`;

            function sendApiRequest(targetModelId) {
                const modelDisplayName = targetModelId.replace('models/', '');
                statusText.innerText = `狀態：使用 ${modelDisplayName} 思考中...(請稍候)`;
                statusText.style.color = '#000';

                const triggerRetry = (reasonMsg) => {
                    console.warn(`[嘗試失敗] ${targetModelId} 原因:`, reasonMsg);
                    toggleModelExhausted(targetModelId, true);

                    if (!autoSwitchCheckbox.checked) {
                        statusText.innerText = `錯誤：${modelDisplayName} ${reasonMsg}。(自動降級重試已關閉)`;
                        statusText.style.color = 'red'; submitBtn.disabled = false; submitBtn.style.opacity = '1'; return;
                    }

                    const nextModelId = getNextBestModel();
                    if (nextModelId) {
                        statusText.innerText = `⚠️ ${modelDisplayName} ${reasonMsg}，切換至 ${nextModelId.replace('models/', '')} 重試...`;
                        statusText.style.color = '#d02718'; modelSelect.value = nextModelId;
                        setTimeout(() => sendApiRequest(nextModelId), 1500);
                    } else {
                        statusText.innerText = `錯誤：所有可用的模型皆嘗試失敗。最後一次錯誤：${reasonMsg}`;
                        statusText.style.color = 'red'; submitBtn.disabled = false; submitBtn.style.opacity = '1';
                    }
                };

                const handleApiResponse = (responseText, parserCallback) => {
                    try {
                        const res = JSON.parse(responseText);

                        if (res.error) {
                            const shortMsg = res.error.message ? res.error.message.substring(0, 30) + '...' : '未知錯誤';
                            triggerRetry(`回傳錯誤 (${shortMsg})`); return;
                        }

                        toggleModelExhausted(targetModelId, false);

                        const textResult = parserCallback(res);
                        const buildJson = JSON.parse(textResult);

                        // ★ 新增：檢查是否觸發了防呆機制 (AI_WARNING)
                        if (buildJson.AI_WARNING) {
                            warningBox.innerHTML = `🛑 <b>AI 評估無法達成需求：</b><br>${buildJson.AI_WARNING.replace(/\n/g, '<br>')}`;
                            warningBox.style.display = 'block';
                            statusText.innerText = '狀態：需求無法達成，已終止配單。';
                            statusText.style.color = '#d02718';
                            submitBtn.disabled = false; submitBtn.style.opacity = '1';
                            return; // 終止流程，不執行後續的選單勾選
                        }

                        statusText.innerText = '狀態：配單完成！正在自動勾選...';
                        let selectedCount = 0;

                        for (const [selectName, optionId] of Object.entries(buildJson)) {
                            const selectEl = document.querySelector(`select[name="${selectName}"]`);
                            if (selectEl) {
                                selectEl.value = optionId;
                                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                                selectedCount++;
                            }
                        }

                        statusText.innerText = `狀態：已成功自動填寫 ${selectedCount} 項組件！`;
                        statusText.style.color = 'green';
                        promptInput.value = '';
                        promptInput.placeholder = '可繼續輸入追問（例如：預算爆了，幫我把顯卡降級...）';
                        submitBtn.disabled = false; submitBtn.style.opacity = '1';

                    } catch (e) {
                        triggerRetry('未依格式輸出或被安全機制阻擋');
                    }
                };

                const errorHandler = (err) => {
                    submitBtn.disabled = false; submitBtn.style.opacity = '1';
                    statusText.innerText = '錯誤：API 請求失敗，請檢查網路連線。';
                    statusText.style.color = 'red';
                };

                if (provider === 'gemini') {
                    GM_xmlhttpRequest({
                        method: 'POST', url: `https://generativelanguage.googleapis.com/v1beta/${targetModelId}:generateContent?key=${apiKey}`, headers: { 'Content-Type': 'application/json' },
                        data: JSON.stringify({ contents: [{ parts: [{ text: userContentText }] }], systemInstruction: { parts: [{ text: systemInstruction }] }, generationConfig: { temperature: 0.2, response_mime_type: "application/json" } }),
                        onload: (res) => handleApiResponse(res.responseText, data => data.candidates[0].content.parts[0].text), onerror: errorHandler
                    });
                } else if (provider === 'openai') {
                    GM_xmlhttpRequest({
                        method: 'POST', url: 'https://api.openai.com/v1/chat/completions', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                        data: JSON.stringify({ model: targetModelId, messages: [{ role: "system", content: systemInstruction }, { role: "user", content: userContentText }], response_format: { type: "json_object" }, temperature: 0.2 }),
                        onload: (res) => handleApiResponse(res.responseText, data => data.choices[0].message.content), onerror: errorHandler
                    });
                }
            }

            sendApiRequest(currentTargetModel);
        } catch (error) {
            submitBtn.disabled = false; submitBtn.style.opacity = '1';
            statusText.innerText = '發生未知的系統錯誤。';
            statusText.style.color = 'red';
        }
    });

})();