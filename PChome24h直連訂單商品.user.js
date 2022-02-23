// ==UserScript==
// @namespace    https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @name         PChome24h直連訂單商品
// @description  於訂單內點擊商品ID數次可開啟原商品頁面.
// @copyright    2019, HrJasn (https://greasyfork.org/zh-TW/users/142344-jasn-hr)
// @license      GPL-3.0-or-later
// @version      1.1.1
// @icon         https://www.google.com/s2/favicons?domain=ecvip.pchome.com.tw
// @include		 http*://ecvip.pchome.com.tw/*
// @exclude		 http*://www.pchome.com.tw/*
// @grant        none
// ==/UserScript==

console.log("PChome24h直連訂單商品");

window.addEventListener('load', () =>{

    const observeDOM = (()=>{
        const ObSrvDomMut = window.MutationObserver || window.WebKitMutationObserver;
        return (obj,callback)=>{
            if( !obj || obj.nodeType !== 1 ) {return;}
            if( ObSrvDomMut ) {
                const mutObserver = new ObSrvDomMut(callback);
                mutObserver.observe( obj, { childList:true, subtree:true });
                return mutObserver;
            } else if( window.addEventListener ) {
                obj.addEventListener('DOMNodeInserted', callback, false);
                obj.addEventListener('DOMNodeRemoved', callback, false);
            }
        }
    })();

    observeDOM(document.body, function(docElms){
        let addedNodes = [];
        docElms.forEach(record => record.addedNodes.length & addedNodes.push(...record.addedNodes));
        changeProdIDtoLink(this,addedNodes);
    });

    function changeProdIDtoLink(observeOBJ,addedNodes){
        addedNodes.forEach((addedNode)=>{
            if(addedNode.querySelectorAll){
                addedNode.querySelectorAll('tr.singleRow td').forEach((singleRow)=>{
                    const Prod = singleRow.innerText.match(/^\(商品ID：.*\)/);
                    if(Prod){
                        const ProdIDCleanData = Prod[0].replace(/[\(\)｜]/g,"");
                        const ProdID = ProdIDCleanData.replace(/^商品ID：([A-Za-z0-9]+\-[A-Za-z0-9]+\-[A-Za-z0-9]+)$/,"$1");
                        const ProdIDBase = ProdID.replace(/^([A-Za-z0-9]+\-[A-Za-z0-9]+)\-[A-Za-z0-9]+$/,"$1");
                        const ProdIDLinkHTML = '<a href="https://24h.pchome.com.tw/prod/'+ProdIDBase+'" target="_blank">'+ProdID+'</a>';
                        singleRow.innerHTML = singleRow.innerHTML.replace(ProdID,ProdIDLinkHTML);
                    }
                });
            }
        });
    }

});
