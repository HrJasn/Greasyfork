// ==UserScript==

// @name               YouTube Button As Add Notify Video To WL
// @name:zh-TW         YouTube 訂閱通知影片加入稍後觀看清單按鈕
// @name:zh-CN         YouTube 订阅通知影片加入稍后观看清单按钮
// @name:ja            YouTube 登録通知ビデオを後で見るボタンに追加
// @description        Add button that join Video to watch later playlist from notify.
// @description:zh-TW  增加可將通知影片加入稍後觀看清單的按鈕。
// @description:zh-CN  添加可将通知视频加入稍后观看清单的按钮。
// @description:ja     通知から後でプレイリストを視聴するビデオに参加するボタンを追加します。
// @copyright          2023, HrJasn (https://greasyfork.org/zh-TW/users/142344-jasn-hr)
// @license            MIT
// @icon               https://www.google.com/s2/favicons?domain=www.youtube.com
// @homepageURL        https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @supportURL         https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @version            1.3
// @namespace          https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @grant              none
// @match              http*://www.youtube.com/*
// @exclude            http*://www.google.com/*

// ==/UserScript==

(() => {
    'use strict';
    window.addEventListener('load',() => {
        console.log('YouTube Button As Add Notify Video To WL is loading.');
        let YBAANVTWobserver;
        YBAANVTWobserver = new MutationObserver( (mutations) => {
            mutations.forEach((adNds)=>{
                adNds.addedNodes.forEach((adNde)=>{
                    if( (adNde) && (adNde.querySelector) && (adNde.querySelector('ytd-notification-renderer button[aria-label]')) ){
                        let ynrbe = adNde.querySelector('ytd-notification-renderer button[aria-label]');
                        if( (ynrbe) && (ynrbe.parentNode) && !(ynrbe.parentNode.querySelector('button[name="addtowl"]')) ){
                            ynrbe.parentNode.insertAdjacentHTML("beforeend",`
                                <button id="button" class="style-scope yt-icon-button" name="addtowl">
                                  <div style="width: 100%; height: 100%; fill: currentcolor;">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;color: white;">
                                              <path d="M14.97 16.95 10 13.87V7h2v5.76l4.03 2.49-1.06 1.7zM12 3c-4.96 0-9 4.04-9 9s4.04 9 9 9 9-4.04 9-9-4.04-9-9-9m0-1c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"></path>
                                    </svg>
                                  </div>
                                </button>`);
                            let awlbe = ynrbe.parentNode.querySelector('button[name="addtowl"]');
                            if(awlbe){
                                console.log('YouTube Button As Add Notify Video To WL is loaded.');
                                awlbe.addEventListener('click', async (evnt)=>{
                                    evnt.preventDefault();
                                    evnt.stopPropagation();
                                    evnt.stopImmediatePropagation();
                                    let evne = evnt.target;
                                    console.log(evne);
                                    let addedVideoId = null;
                                    try{
                                        addedVideoId = evne.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('a[href *= "/watch?v="]').href.match(/watch\?v=([^=&\?]+)&?/)[1];
                                    }catch(err){
                                        try{
                                            addedVideoId = evne.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('a[href *= "/shorts/"]').href.match(/shorts\/([^\/\?]+)\/?/)[1];
                                        }catch(err2){
                                            console.log(err2);
                                        };
                                        console.log(err);
                                    };
                                    if(addedVideoId){
                                        let ytactsjson = [{
                                            "addedVideoId": addedVideoId,
                                            "action": "ACTION_ADD_VIDEO"
                                        }];
                                        let res = await fetchYTAddVideoAPI(ytactsjson,'WL');
                                        console.log(res);
                                        if(res.status === 200){
                                            evne.querySelector('svg').innerHTML = '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9.8 17.3l-4.2-4.1L7 11.8l2.8 2.7L17 7.4l1.4 1.4-8.6 8.5z"></path>';
                                        } else {
                                            evne.querySelector('svg').innerHTML = '<path d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>';
                                        };
                                    };
                                    async function getSApiSidHash(SAPISID, origin) {
                                        function sha1(str) {
                                            return window.crypto.subtle
                                                .digest("SHA-1", new TextEncoder().encode(str))
                                                .then((buf) => {
                                                return Array.prototype.map
                                                    .call(new Uint8Array(buf), (x) => ("00" + x.toString(16)).slice(-2))
                                                    .join("")
                                            });
                                        };
                                        const TIMESTAMP_MS = Date.now();
                                        const digest = await sha1(`${TIMESTAMP_MS} ${SAPISID} ${origin}`);
                                        return `${TIMESTAMP_MS}_${digest}`;
                                    };
                                    async function fetchYTAddVideoAPI(actions,playlistId){
                                        return fetch("https://www.youtube.com/youtubei/v1/browse/edit_playlist?key=" + ytcfg.data_.INNERTUBE_API_KEY + "&prettyPrint=false", {
                                            "headers": {
                                                "accept": "*/*",
                                                "authorization": "SAPISIDHASH " + await getSApiSidHash(document.cookie.split("SAPISID=")[1].split("; ")[0], window.origin),
                                                "content-type": "application/json"
                                            },
                                            "body": JSON.stringify({
                                                "context": {
                                                    "client": {
                                                        clientName: "WEB",
                                                        clientVersion: ytcfg.data_.INNERTUBE_CLIENT_VERSION
                                                    }
                                                },
                                                "actions": actions,
                                                "playlistId": "WL"
                                            }),
                                            "method": "POST"
                                        });
                                    };

                                });
                            };
                        };
                    };
                });
            });
        });
        YBAANVTWobserver.observe(document, {attributes:true, childList:true, subtree:true});
    });
})();
