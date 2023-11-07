﻿// ==UserScript==

// @name               巴哈姆特動畫瘋[Shift]+[→]跳過1m30s
// @description        巴哈姆特動畫瘋按下快捷鍵[Shift]+[→]跳過1分30秒
// @copyright          2023, HrJasn (https://greasyfork.org/zh-TW/users/142344-jasn-hr)
// @license            MIT
// @icon               https://www.google.com/s2/favicons?domain=ani.gamer.com.tw
// @homepageURL        https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @supportURL         https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @version            1.1
// @namespace          https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @grant              none
// @match              http*://ani.gamer.com.tw/animeVideo.php?sn=*
// @exclude            http*://ani.gamer.com.tw/

// ==/UserScript==

(() => {
    let observer;
    observer = new MutationObserver( (mutations) => {
        mutations.forEach((adNds)=>{
            adNds.addedNodes.forEach((adNde)=>{
                if( (adNde) && (adNde.querySelector) && (adNde.querySelector('video')) ){
                    console.log('巴哈姆特動畫瘋快捷鍵跳過1m30s已讀入。');
                    observer.disconnect();
                    const videoe = document.querySelector('video');
                    const videopne = videoe.parentNode;
                    let keyDownHis = {};
                    if (videopne.getAttribute('1m30sEvntSet') !== true) {
                        videopne.addEventListener('keydown', (evnt) => {
                            evnt.target.setAttribute('1m30sEvntSet', true);
                            keyDownHis[evnt.key] = true;
                        });
                        videopne.addEventListener('keyup', (evnt) => {
                            evnt.target.setAttribute('1m30sEvntSet', true);
                            switch(true){
                                case ( (keyDownHis.Shift) && (keyDownHis.ArrowRight) ) : {
                                    let nt = evnt.target.querySelector('video').currentTime + 85;
                                    let fwimgd = document.querySelector('img[src="https://i2.bahamut.com.tw/anime/forward.svg"]').nextElementSibling;
                                    let evtv = evnt.target.querySelector('video');
                                    fwimgd.innerHTML = '1m30s';
                                    let chgtdevt = (tpevnt)=>{
                                        if(evtv.currentTime >= nt){
                                            fwimgd.innerHTML = '5s';
                                            tpevnt.target.removeEventListener('timeupdate',chgtdevt);
                                        };
                                    };
                                    evtv.addEventListener('timeupdate', chgtdevt);
                                    evnt.target.querySelector('video').currentTime = nt;
                                } break;
                                case ( (keyDownHis.Shift) && (keyDownHis.ArrowLeft) ) : {
                                    let nt = evnt.target.querySelector('video').currentTime - 85;
                                    let bkimgd = document.querySelector('img[src="https://i2.bahamut.com.tw/anime/backward.svg"]').nextElementSibling;
                                    let evtv = evnt.target.querySelector('video');
                                    bkimgd.innerHTML = '1m30s';
                                    let chgtdevt = (tpevnt)=>{
                                        if(evtv.currentTime >= nt){
                                            bkimgd.innerHTML = '5s';
                                            tpevnt.target.removeEventListener('timeupdate',chgtdevt);
                                        };
                                    };
                                    evtv.addEventListener('timeupdate', chgtdevt);
                                    evnt.target.querySelector('video').currentTime = nt;
                                } break;
                                default :
                                    break;
                            };
                            keyDownHis = {};
                        });
                    };
                };
            });
        });
    });
    observer.observe(document, {attributes:true, childList:true, subtree:true});
})();
