// ==UserScript==
// @name         原價屋 AI 建議估價清單
// @namespace    http://tampermonkey.net/
// @version      2026-03-15.6
// @description  在原價屋估價頁面讓AI自動抓取當下選項配單。支援 Gemini/ChatGPT、視窗縮放、API密鑰管理與後續追問修改配單。
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
        font-family: Arial, sans-serif;
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
        width: 320px;
        background: #fff;
        border: 2px solid #8a2a21;
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        box-sizing: border-box;
    `;

    // 視窗標題列
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;';

    const title = document.createElement('h3');
    title.innerText = '🤖 AI 組裝助手';
    title.style.cssText = 'margin: 0; color: #8a2a21; font-size: 16px; font-weight: bold;';

    const minimizeBtn = document.createElement('button');
    minimizeBtn.innerText = '➖';
    minimizeBtn.title = '縮小視窗';
    minimizeBtn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: #555;
        padding: 0 5px;
    `;
    minimizeBtn.onmouseover = () => minimizeBtn.style.color = '#8a2a21';
    minimizeBtn.onmouseout = () => minimizeBtn.style.color = '#555';

    header.appendChild(title);
    header.appendChild(minimizeBtn);
    guiWindow.appendChild(header);

    // AI 引擎切換區塊
    const providerContainer = document.createElement('div');
    providerContainer.style.cssText = 'margin-bottom: 10px;';

    const providerLabel = document.createElement('label');
    providerLabel.innerText = '🧠 選擇 AI 引擎:';
    providerLabel.style.cssText = 'display: block; font-size: 12px; font-weight: bold; color: #555; margin-bottom: 3px;';

    const providerSelect = document.createElement('select');
    providerSelect.style.cssText = 'width: 100%; box-sizing: border-box; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';
    providerSelect.innerHTML = `
        <option value="gemini">Google Gemini</option>
        <option value="openai">OpenAI ChatGPT</option>
    `;
    providerSelect.value = GM_getValue('ai_provider', 'gemini');

    providerContainer.appendChild(providerLabel);
    providerContainer.appendChild(providerSelect);
    guiWindow.appendChild(providerContainer);

    // API Key 標籤與申請連結區塊
    const apiKeyLabelContainer = document.createElement('div');
    apiKeyLabelContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; font-size: 12px;';

    const apiKeyLabel = document.createElement('label');
    apiKeyLabel.innerText = '🔑 API Key (自動儲存本機):';
    apiKeyLabel.style.color = '#555';
    apiKeyLabel.style.fontWeight = 'bold';

    const apiKeyLink = document.createElement('a');
    apiKeyLink.target = '_blank';
    apiKeyLink.style.color = '#0066cc';
    apiKeyLink.style.textDecoration = 'none';
    apiKeyLink.style.fontWeight = 'bold';

    apiKeyLabelContainer.appendChild(apiKeyLabel);
    apiKeyLabelContainer.appendChild(apiKeyLink);
    guiWindow.appendChild(apiKeyLabelContainer);

    // API Key 輸入框與清除按鈕容器
    const apiKeyInputWrapper = document.createElement('div');
    apiKeyInputWrapper.style.cssText = 'display: flex; gap: 5px; margin-bottom: 10px;';

    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.style.cssText = 'flex-grow: 1; box-sizing: border-box; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';

    const clearKeyBtn = document.createElement('button');
    clearKeyBtn.innerText = '🗑️';
    clearKeyBtn.title = '清除本機儲存的 API Key';
    clearKeyBtn.style.cssText = 'padding: 6px; background: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; flex-shrink: 0;';

    apiKeyInputWrapper.appendChild(apiKeyInput);
    apiKeyInputWrapper.appendChild(clearKeyBtn);
    guiWindow.appendChild(apiKeyInputWrapper);

    const loadModelsBtn = document.createElement('button');
    loadModelsBtn.innerText = '🔄 驗證並載入模型列表';
    loadModelsBtn.style.cssText = `
        width: 100%;
        box-sizing: border-box;
        padding: 10px;
        margin-bottom: 10px;
        background: #555;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        height: auto;
        line-height: 1.4;
        white-space: normal;
        font-weight: bold;
    `;

    // 模型選擇區塊
    const modelContainer = document.createElement('div');
    modelContainer.style.display = 'none';
    modelContainer.style.marginBottom = '10px';
    modelContainer.style.padding = '10px';
    modelContainer.style.background = '#f5f5f5';
    modelContainer.style.border = '1px solid #ddd';
    modelContainer.style.borderRadius = '5px';
    modelContainer.style.boxSizing = 'border-box';

    const modelSearchInput = document.createElement('input');
    modelSearchInput.type = 'text';
    modelSearchInput.placeholder = '🔍 搜尋模型...';
    modelSearchInput.style.cssText = 'width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';

    const modelSelect = document.createElement('select');
    modelSelect.style.cssText = 'width: 100%; box-sizing: border-box; padding: 6px; border: 1px solid #ccc; border-radius: 4px;';

    modelContainer.appendChild(modelSearchInput);
    modelContainer.appendChild(modelSelect);

    // 提示詞與送出區塊
    const promptInput = document.createElement('textarea');
    promptInput.placeholder = '請輸入你的需求或追問修改（例如：預算3萬內、想順跑2077... / 或者追問：幫我把目前的機殼換成白色的）';
    promptInput.style.cssText = 'width: 100%; height: 80px; box-sizing: border-box; margin-bottom: 10px; padding: 8px; resize: none; border: 1px solid #ccc; border-radius: 4px;';

    const submitBtn = document.createElement('button');
    submitBtn.innerText = '⚡ 送出需求並分析';
    submitBtn.style.cssText = `
        width: 100%;
        box-sizing: border-box;
        padding: 12px;
        background: linear-gradient(to bottom, #c62d1f 5%, #f24437 100%);
        color: #fff;
        border: 1px solid #d02718;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        height: auto;
        line-height: 1.4;
        white-space: normal;
    `;

    const statusText = document.createElement('p');
    statusText.innerText = '狀態：請先輸入 API Key 並載入模型';
    statusText.style.cssText = 'margin: 10px 0 0 0; font-size: 12px; color: #555; word-break: break-all; line-height: 1.4;';

    guiWindow.appendChild(loadModelsBtn);
    guiWindow.appendChild(modelContainer);
    guiWindow.appendChild(promptInput);
    guiWindow.appendChild(submitBtn);
    guiWindow.appendChild(statusText);

    mainContainer.appendChild(minimizedIcon);
    mainContainer.appendChild(guiWindow);
    document.body.appendChild(mainContainer);

    // --- 4. 處理視窗縮放與 UI 狀態切換 ---
    let isMinimized = GM_getValue('gui_is_minimized', false);
    let cachedModels = [];

    function toggleView() {
        if (isMinimized) {
            minimizedIcon.style.display = 'flex';
            guiWindow.style.display = 'none';
        } else {
            minimizedIcon.style.display = 'none';
            guiWindow.style.display = 'block';
        }
    }

    minimizedIcon.addEventListener('click', () => {
        isMinimized = false;
        GM_setValue('gui_is_minimized', false);
        toggleView();
    });

    minimizeBtn.addEventListener('click', () => {
        isMinimized = true;
        GM_setValue('gui_is_minimized', true);
        toggleView();
    });

    toggleView();

    function updateProviderUI() {
        const provider = providerSelect.value;
        GM_setValue('ai_provider', provider);

        if (provider === 'gemini') {
            apiKeyInput.value = GM_getValue('gemini_api_key', '');
            apiKeyInput.placeholder = '請貼上您的 Gemini API Key';
            apiKeyLink.href = 'https://aistudio.google.com/api-keys';
            apiKeyLink.innerText = '申請 Gemini Key ↗';
        } else {
            apiKeyInput.value = GM_getValue('openai_api_key', '');
            apiKeyInput.placeholder = '請貼上您的 OpenAI API Key';
            apiKeyLink.href = 'https://platform.openai.com/api-keys';
            apiKeyLink.innerText = '申請 OpenAI Key ↗';
        }

        cachedModels = [];
        modelSelect.innerHTML = '';
        modelContainer.style.display = 'none';

        if (apiKeyInput.value.trim() !== '') {
            statusText.innerText = '狀態：已讀取儲存的 API Key，請點擊上方按鈕載入模型。';
            statusText.style.color = '#555';
        } else {
            statusText.innerText = '狀態：請先輸入 API Key 並載入模型';
            statusText.style.color = '#555';
        }
    }

    providerSelect.addEventListener('change', updateProviderUI);

    // 清除 API Key 按鈕事件
    clearKeyBtn.addEventListener('click', () => {
        const provider = providerSelect.value;
        if (provider === 'gemini') {
            GM_setValue('gemini_api_key', '');
        } else {
            GM_setValue('openai_api_key', '');
        }
        apiKeyInput.value = '';
        cachedModels = [];
        modelContainer.style.display = 'none';
        statusText.innerText = `狀態：已成功清除 ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} 的 API Key。`;
        statusText.style.color = '#d02718';
    });

    // 初始化 UI
    updateProviderUI();

    // --- 5. 處理模型載入與搜尋邏輯 ---
    function renderModels(keyword = '') {
        modelSelect.innerHTML = '';
        const lowerKeyword = keyword.toLowerCase();
        let matchCount = 0;

        cachedModels.forEach(m => {
            if (m.id.toLowerCase().includes(lowerKeyword) || (m.name && m.name.toLowerCase().includes(lowerKeyword))) {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.text = m.name;

                if ((m.id.includes('gemini-1.5-flash') && !m.id.includes('8b')) || m.id === 'gpt-4o-mini') {
                    opt.selected = true;
                }

                modelSelect.appendChild(opt);
                matchCount++;
            }
        });

        if (matchCount === 0) {
            const opt = document.createElement('option');
            opt.text = '找不到符合的模型';
            opt.disabled = true;
            modelSelect.appendChild(opt);
        }
    }

    loadModelsBtn.addEventListener('click', () => {
        const provider = providerSelect.value;
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            statusText.innerText = '錯誤：請先輸入 API Key！';
            statusText.style.color = 'red';
            return;
        }

        statusText.innerText = '狀態：正在載入模型列表...';
        statusText.style.color = '#000';
        loadModelsBtn.disabled = true;

        if (provider === 'gemini') {
            GM_setValue('gemini_api_key', apiKey);
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
                onload: function(response) {
                    loadModelsBtn.disabled = false;
                    try {
                        const res = JSON.parse(response.responseText);
                        if (res.error) {
                            statusText.innerText = `API 錯誤: ${res.error.message}`;
                            statusText.style.color = 'red';
                            return;
                        }
                        cachedModels = res.models
                            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                            .map(m => ({ id: m.name, name: m.displayName ? `${m.displayName} (${m.name.replace('models/', '')})` : m.name }));

                        renderModels('');
                        modelContainer.style.display = 'block';
                        statusText.innerText = `狀態：成功載入 ${cachedModels.length} 個 Gemini 模型！`;
                        statusText.style.color = 'green';
                    } catch (e) {
                        statusText.innerText = '錯誤：無法解析模型列表回應。';
                        statusText.style.color = 'red';
                    }
                },
                onerror: function(err) {
                    loadModelsBtn.disabled = false;
                    statusText.innerText = '錯誤：API 請求失敗，請檢查網路。';
                    statusText.style.color = 'red';
                }
            });
        } else if (provider === 'openai') {
            GM_setValue('openai_api_key', apiKey);
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://api.openai.com/v1/models',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                onload: function(response) {
                    loadModelsBtn.disabled = false;
                    try {
                        const res = JSON.parse(response.responseText);
                        if (res.error) {
                            statusText.innerText = `API 錯誤: ${res.error.message}`;
                            statusText.style.color = 'red';
                            return;
                        }
                        cachedModels = res.data
                            .filter(m => m.id.startsWith('gpt') || m.id.startsWith('o'))
                            .map(m => ({ id: m.id, name: m.id }))
                            .sort((a, b) => b.id.localeCompare(a.id));

                        renderModels('');
                        modelContainer.style.display = 'block';
                        statusText.innerText = `狀態：成功載入 ${cachedModels.length} 個 OpenAI 模型！`;
                        statusText.style.color = 'green';
                    } catch (e) {
                        statusText.innerText = '錯誤：無法解析模型列表回應。檢查 API Key 權限。';
                        statusText.style.color = 'red';
                    }
                },
                onerror: function(err) {
                    loadModelsBtn.disabled = false;
                    statusText.innerText = '錯誤：API 請求失敗，請檢查網路。';
                    statusText.style.color = 'red';
                }
            });
        }
    });

    modelSearchInput.addEventListener('input', (e) => {
        renderModels(e.target.value);
    });

    // --- 6. 監聽送出事件與獲取當下所有選項 (含目前已選項) ---
    submitBtn.addEventListener('click', () => {
        const provider = providerSelect.value;
        const apiKey = apiKeyInput.value.trim();
        const prompt = promptInput.value.trim();
        const selectedModel = modelSelect.value;

        if (!apiKey) {
            statusText.innerText = '錯誤：尚未填寫 API Key！';
            statusText.style.color = 'red';
            return;
        }
        if (modelContainer.style.display === 'none' || !selectedModel) {
            statusText.innerText = '錯誤：請先載入並選擇一個模型！';
            statusText.style.color = 'red';
            return;
        }
        if (!prompt) {
            statusText.innerText = '錯誤：請輸入組裝需求！';
            statusText.style.color = 'red';
            return;
        }

        statusText.innerText = '狀態：正在整理網頁選單與當前配單資料...';
        statusText.style.color = '#000';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';

        try {
            const categories = {};
            const currentSelections = {}; // 記錄網頁目前已經選擇的項目

            document.querySelectorAll('select[name^="n"]').forEach(select => {
                const options = [];
                const categoryTitle = select.options[0] ? select.options[0].text : select.name;

                // 掃描所有可用選項
                Array.from(select.options).forEach(opt => {
                    if (opt.value && opt.value !== "0" && !opt.disabled) {
                        options.push({ id: opt.value, name: opt.text });
                    }
                });

                if (options.length > 0) {
                    categories[select.name] = { title: categoryTitle, items: options };
                }

                // 紀錄該選單目前「已被選中」的項目 (排除預設的"請選擇")
                if (select.value && select.value !== "0") {
                    const selectedOpt = Array.from(select.options).find(opt => opt.value === select.value);
                    if (selectedOpt) {
                        currentSelections[select.name] = {
                            title: categoryTitle,
                            id: select.value,
                            name: selectedOpt.text
                        };
                    }
                }
            });

            const modelDisplayName = selectedModel.replace('models/', '');
            statusText.innerText = `狀態：使用 ${modelDisplayName} 配單中...(請稍候)`;

            // 系統指令：增加「後續修改」的處理邏輯
            const systemInstruction = `你是一個專業的電腦組裝人員。
我將會提供「使用者的需求」、「目前網頁上已選擇的零件(如果有)」以及「原價屋當下的所有零件清單 JSON」。
請依據使用者預算及用途，在清單中挑選最適合的電腦組合。

【重要任務：追問修改】：如果使用者需求是針對「目前的配單」進行修改（例如：機殼換成白色、加一條記憶體），請你務必保留「目前已選擇零件」中不需要更動的部分，僅替換使用者要求修改的項目，並重新考量整體相容性。最後回傳完整的配單。

【相容性極度重要】：
1. CPU 必須與主機板腳位對應。
2. 記憶體必須確保與主機板相容 (DDR4 / DDR5)。
3. 電源供應器瓦數必須足以支撐顯示卡及 CPU。
4. 如果使用者要含作業系統，務必在作業系統分類中挑選。

請回傳一個純 JSON 物件，不要有 Markdown 語法 (不要 \`\`\`json 等標籤)。
JSON 的 Key 必須是選單的 name (如 n1, n2)，Value 是選中的商品 id。
範例格式：
{
  "n1": "123456",
  "n2": "654321"
}
只需回傳有選到的分類即可。`;

            // 組合發送給 AI 的內容，加入 currentSelections 變數
            const userContentText = `【使用者需求】\n${prompt}

【目前網頁上已選擇的零件(JSON)】
${Object.keys(currentSelections).length > 0 ? JSON.stringify(currentSelections) : '目前尚未選擇任何零件'}

【當下所有零件清單】
${JSON.stringify(categories)}`;

            const handleApiResponse = (responseText, parserCallback) => {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                try {
                    const res = JSON.parse(responseText);
                    if (res.error) {
                        statusText.innerText = `API 錯誤: ${res.error.message}`;
                        statusText.style.color = 'red';
                        return;
                    }

                    const textResult = parserCallback(res);
                    const buildJson = JSON.parse(textResult);

                    statusText.innerText = '狀態：配單完成！正在為您自動勾選網頁選項...';
                    let selectedCount = 0;

                    for (const [selectName, optionId] of Object.entries(buildJson)) {
                        const selectEl = document.querySelector(`select[name="${selectName}"]`);
                        if (selectEl) {
                            const targetOption = Array.from(selectEl.options).find(opt => opt.value === optionId);
                            if (targetOption) {
                                selectEl.value = optionId;
                                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                                selectedCount++;
                            }
                        }
                    }

                    statusText.innerText = `狀態：已成功自動填寫/修改 ${selectedCount} 項組件！`;
                    statusText.style.color = 'green';

                    // 清空輸入框方便使用者進行下一次追問
                    promptInput.value = '';
                    promptInput.placeholder = '可繼續輸入追問（例如：預算爆了，幫我把顯卡降級...）';

                } catch (e) {
                    console.error('Parse Error:', e, responseText);
                    statusText.innerText = '錯誤：無法解析 AI 回應，該模型可能未依照 JSON 格式輸出。';
                    statusText.style.color = 'red';
                }
            };

            const errorHandler = (err) => {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                statusText.innerText = '錯誤：API 請求失敗，請檢查網路或跨網域權限。';
                statusText.style.color = 'red';
                console.error(err);
            };

            if (provider === 'gemini') {
                const requestBody = {
                    contents: [{ parts: [{ text: userContentText }] }],
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    generationConfig: { temperature: 0.2, response_mime_type: "application/json" }
                };

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${apiKey}`,
                    headers: { 'Content-Type': 'application/json' },
                    data: JSON.stringify(requestBody),
                    onload: (res) => handleApiResponse(res.responseText, data => data.candidates[0].content.parts[0].text),
                    onerror: errorHandler
                });

            } else if (provider === 'openai') {
                const requestBody = {
                    model: selectedModel,
                    messages: [
                        { role: "system", content: systemInstruction },
                        { role: "user", content: userContentText }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.2
                };

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://api.openai.com/v1/chat/completions',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    data: JSON.stringify(requestBody),
                    onload: (res) => handleApiResponse(res.responseText, data => data.choices[0].message.content),
                    onerror: errorHandler
                });
            }

        } catch (error) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            statusText.innerText = '發生未知的系統錯誤。';
            statusText.style.color = 'red';
            console.error(error);
        }
    });

})();