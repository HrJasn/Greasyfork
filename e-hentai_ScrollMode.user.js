// ==UserScript==
// @name               e-hentai Scroll Mode
// @name:zh-TW         e-hentai 滾動模式
// @namespace          https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @description        Scroll to browsing e-hentai's art with virtual scrolling.
// @version            4.4.0
// @match              http*://e-hentai.org/s/*
// @match              http*://exhentai.org/s/*
// @exclude            http*://www.e-hentai.org/*
// @grant              none
// ==/UserScript==

(() => {
    // === UI 建立 ===
    const scrollMode_DIV = document.createElement("div");
    // 保留 overflow-anchor: none 阻止瀏覽器干擾
    scrollMode_DIV.style = "z-index:9999; position:fixed; cursor:pointer; left:0px; width:100%; height:0px; top:100vh; overflow-y:scroll; overflow-x:hidden; overflow-anchor:none; background-color:#333; transition:top 0.4s ease; display:flex; flex-direction:column; align-items:center;";
    document.body.appendChild(scrollMode_DIV);

    // === 資料層 ===
    const pagesData = new Map(); 
    let isScrollModeActive = false;
    let currentPageNum = 1;

    function extractPageInfo(doc = document, url = window.location.href) {
        const pageMatch = url.match(/-(\d+)$/);
        if (!pageMatch) return null;
        
        const pageNum = parseInt(pageMatch[1]);
        const imgEl = doc.querySelector('#img');
        const pImg = doc.querySelector('a[href*="/s/"] > img[src*="/p.png"]')?.parentNode?.href;
        const nImg = doc.querySelector('a[href*="/s/"] > img[src*="/n.png"]')?.parentNode?.href;

        if (imgEl) {
            const data = {
                pageNum: pageNum,
                pageUrl: url,
                imgUrl: imgEl.src,
                prevUrl: pImg !== url ? pImg : null,
                nextUrl: nImg !== url ? nImg : null
            };
            if (!pagesData.has(pageNum)) {
                pagesData.set(pageNum, data);
            }
            return data;
        }
        return null;
    }

    const initialData = extractPageInfo();
    if (initialData) currentPageNum = initialData.pageNum;

    // === 顯示層：核心鎖定邏輯 ===

    // 【核心機制】保護當前畫面的視角，不管 DOM 怎麼變，鎖死當前圖片的相對位置
    function preserveScrollPosition(action) {
        if (!isScrollModeActive) {
            action();
            return;
        }
        
        const activeWrapper = scrollMode_DIV.querySelector(`div[data-page="${currentPageNum}"]`);
        let oldOffset = null;
        
        // 動作前：記錄當前圖片距離視窗頂部的精確像素
        if (activeWrapper) {
            oldOffset = activeWrapper.getBoundingClientRect().top;
        }

        action(); // 執行 DOM 更新 (插入圖片、改變高度等)

        // 動作後：計算位移差並補償
        if (activeWrapper && oldOffset !== null) {
            const newOffset = activeWrapper.getBoundingClientRect().top;
            const diff = newOffset - oldOffset;
            if (diff !== 0) {
                scrollMode_DIV.scrollTop += diff;
            }
        }
    }

    // 整合 DOM 更新與圖片渲染
    function renderUpdates(skipPreserve = false) {
        const updateLogic = () => {
            const sortedPages = Array.from(pagesData.keys()).sort((a, b) => a - b);
            
            // 1. 建立外層容器
            sortedPages.forEach(pageNum => {
                let wrapper = scrollMode_DIV.querySelector(`div[data-page="${pageNum}"]`);
                if (!wrapper) {
                    wrapper = document.createElement('div');
                    wrapper.dataset.page = pageNum;
                    // 將 margin 換成 padding，這樣 getBoundingClientRect().height 才能完美包含間距
                    wrapper.style = "width:100%; min-height:80vh; display:flex; justify-content:center; align-items:center; padding-bottom: 20px; box-sizing: border-box;";
                    
                    const existingWrappers = Array.from(scrollMode_DIV.children);
                    const nextNode = existingWrappers.find(el => parseInt(el.dataset.page) > pageNum);
                    
                    if (nextNode) {
                        scrollMode_DIV.insertBefore(wrapper, nextNode);
                    } else {
                        scrollMode_DIV.appendChild(wrapper);
                    }
                }
            });

            // 2. 處理內部圖片載入與卸載
            const wrappers = Array.from(scrollMode_DIV.children);
            wrappers.forEach(wrapper => {
                const pageNum = parseInt(wrapper.dataset.page);
                const isWithinRange = Math.abs(pageNum - currentPageNum) <= 5;
                const imgEl = wrapper.querySelector('img');

                if (isWithinRange) {
                    if (!imgEl) {
                        const data = pagesData.get(pageNum);
                        if (!data) return;

                        const newImg = document.createElement('img');
                        newImg.src = data.imgUrl;
                        newImg.style = "max-width:100%; height:auto; display:block;";
                        
                        // 圖片非同步載入完成時，高度會改變，所以也要包在保護機制內
                        newImg.onload = () => {
                            preserveScrollPosition(() => {
                                wrapper.style.minHeight = 'auto';
                                wrapper.style.height = 'auto';
                            });
                        }; 
                        wrapper.appendChild(newImg);
                    }
                } else {
                    if (imgEl) {
                        // 鎖定精確高度，拔除圖片
                        wrapper.style.height = wrapper.getBoundingClientRect().height + "px";
                        wrapper.style.minHeight = wrapper.style.height;
                        imgEl.remove();
                    }
                }
            });
        };

        if (skipPreserve) {
            updateLogic();
        } else {
            preserveScrollPosition(updateLogic);
        }
    }

    // === 捲動監聽器 ===
    function handleScroll() {
        if (!isScrollModeActive) return;

        const viewportCenter = window.innerHeight / 2;
        const wrappers = Array.from(scrollMode_DIV.children);
        let closestPage = currentPageNum;
        let minDistance = Infinity;

        for (let wrapper of wrappers) {
            const rect = wrapper.getBoundingClientRect();
            
            // 優先判定：涵蓋畫面正中央的，絕對是當前觀看的圖片
            if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
                closestPage = parseInt(wrapper.dataset.page);
                break;
            }
            
            // 備用判定
            const elementCenter = rect.top + (rect.height / 2);
            const distance = Math.abs(elementCenter - viewportCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestPage = parseInt(wrapper.dataset.page);
            }
        }

        if (closestPage !== currentPageNum) {
            currentPageNum = closestPage;
            const currentData = pagesData.get(currentPageNum);
            if (currentData && window.location.href !== currentData.pageUrl) {
                window.history.replaceState(null, "", currentData.pageUrl);
            }
            renderUpdates();
        }
    }

    // === 背景非同步讀取邏輯 ===
    async function fetchPage(url, direction) {
        if (!url || !isScrollModeActive) return;
        
        const targetPageMatch = url.match(/-(\d+)$/);
        if (!targetPageMatch) return;
        const targetPageNum = parseInt(targetPageMatch[1]);

        if (pagesData.has(targetPageNum)) {
            const nextTarget = direction === 'next' ? pagesData.get(targetPageNum).nextUrl : pagesData.get(targetPageNum).prevUrl;
            if (nextTarget) fetchPage(nextTarget, direction);
            return;
        }

        try {
            const res = await fetch(url);
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            const newData = extractPageInfo(doc, res.url);
            if (newData) {
                renderUpdates();
                setTimeout(() => {
                    const nextTarget = direction === 'next' ? newData.nextUrl : newData.prevUrl;
                    if (nextTarget) fetchPage(nextTarget, direction);
                }, 300);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    // === 模式切換邏輯 ===
    function activateScrollMode(e) {
        const isContentShort = document.body.offsetHeight <= window.innerHeight + 50;
        const isScrolledToBottom = (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50;
        
        if (e.deltaY > 0 && (isContentShort || isScrolledToBottom)) {
            if (isScrollModeActive) return;
            isScrollModeActive = true;
            
            document.body.style.overflow = "hidden";
            scrollMode_DIV.style.height = "100vh";
            scrollMode_DIV.style.top = "0px";
            
            // 首次進入不使用保護機制，因為我們要主動改變 scrollTop
            renderUpdates(true);
            
            const currentWrapper = scrollMode_DIV.querySelector(`div[data-page="${currentPageNum}"]`);
            if (currentWrapper) {
                scrollMode_DIV.scrollTop = currentWrapper.offsetTop;
            }
            
            scrollMode_DIV.addEventListener('scroll', handleScroll, { passive: true });
            
            if (initialData.nextUrl) fetchPage(initialData.nextUrl, 'next');
            if (initialData.prevUrl) fetchPage(initialData.prevUrl, 'prev');
        }
    }

    function deactivateScrollMode(e) {
        if (!isScrollModeActive) return;

        let targetPageNum = currentPageNum;
        const clickedWrapper = e.target.closest('div[data-page]');
        if (clickedWrapper) {
            targetPageNum = parseInt(clickedWrapper.dataset.page);
        }

        const targetData = pagesData.get(targetPageNum);
        
        if (targetData && targetData.pageUrl) {
            window.location.href = targetData.pageUrl;
        } else {
            isScrollModeActive = false;
            scrollMode_DIV.style.height = "0px";
            scrollMode_DIV.style.top = "100vh";
            document.body.style.overflow = "auto";
            scrollMode_DIV.removeEventListener('scroll', handleScroll);
        }
    }

    window.addEventListener("wheel", activateScrollMode, { passive: true });
    scrollMode_DIV.addEventListener("click", deactivateScrollMode);

})();