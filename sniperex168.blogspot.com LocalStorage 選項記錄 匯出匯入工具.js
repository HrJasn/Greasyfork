// ==UserScript==
// @name         sniperex168.blogspot.com LocalStorage 選項記錄 匯出/匯入工具
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  點擊時才偵測 localStorage.KEY，並提供匯出/匯入 JSON 功能（改善 script 延遲載入問題）
// @author       HrJasn
// @match        *://sniperex168.blogspot.com/*
// @grant        none
// ==/UserScript==

console.log("載入 sniperex168.blogspot.com LocalStorage 選項記錄 匯出匯入工具");

(function () {
    console.log("執行 sniperex168.blogspot.com LocalStorage 選項記錄 匯出匯入工具");
    // ✅ 只有點擊時才找 script 內的 localStorage key
    function findLocalStorageKey() {
        const scripts = Array.from(document.querySelectorAll("script"));
        for (const script of scripts) {
            const match = script.textContent.match(/localStorage\.([a-zA-Z0-9_]+)/);
            if (match && match[1]) {
                console.log(`✅ 偵測到 localStorage 使用鍵名：${match[1]}`);
                return match[1];
            }
        }
        alert('❌ 找不到任何 localStorage.KEY 使用紀錄');
        return null;
    }

    // 加入樣式
    const style = document.createElement('style');
    style.textContent = `
      #json-buttons {
        position: fixed !important;
        bottom: 100px !important;
        right: 20px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
        z-index: 2147483647 !important;
      }

      .json-btn {
        padding: 8px 12px;
        font-size: 14px;
        background-color: #777;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }

      .json-btn:hover {
        background-color: #000;
      }
    `;
    document.head.appendChild(style);

    // 建立按鈕區塊
    const container = document.createElement('div');
    container.id = 'json-buttons';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'json-btn';
    exportBtn.textContent = '匯出選項記錄JSON';

    const importBtn = document.createElement('button');
    importBtn.className = 'json-btn';
    importBtn.textContent = '匯入選項記錄JSON';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    container.appendChild(exportBtn);
    container.appendChild(importBtn);
    container.appendChild(fileInput);
    document.body.appendChild(container);

    // 匯出功能
    exportBtn.addEventListener('click', () => {
        const detectedKey = findLocalStorageKey();
        if (!detectedKey) {
            alert(`找不到 localStorage.Key`);
            return;
        }

        const data = localStorage.getItem(detectedKey);
        if (!data) {
            alert(`找不到 localStorage.${detectedKey} 的資料`);
            return;
        }

        // 產生時間戳記 yyyyMMdd-HHmmss
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

        // 網址轉為合法檔名
        const urlPart = window.location.href.replace(/[^a-zA-Z0-9]+/g, '_');

        // 完整檔名
        const filename = `${urlPart}_${detectedKey}-${timestamp}.json`;

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });


    // 匯入功能
    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const detectedKey = findLocalStorageKey();
        if (!detectedKey) return;

        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                localStorage.setItem(detectedKey, JSON.stringify(json));

                let confirm = document.querySelectorAll('.confirm');
                if (localStorage.getItem(detectedKey) !== undefined) {
                    var storagetemp = JSON.parse(localStorage.getItem(detectedKey));
                    storagetemp.forEach((item) => {
                        if (item.chk !== 0) {
                            confirm.forEach((elem) => {
                                if (elem.name == item.name) {
                                    elem.checked = true;
                                    elem.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center" // 可選值: "start", "center", "end", "nearest"
                                    });
                                }
                            });
                        }
                    });
                }

                console.log(`匯入成功：已寫入 localStorage.${detectedKey}`);
            } catch (err) {
                alert('匯入失敗：JSON 格式錯誤');
            }
        };
        reader.readAsText(file);
    });
})();
