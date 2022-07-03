// ==UserScript==
// @namespace            https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @name                 Discord Auto remove mention when reply
// @name:zh-TW           Discord 回覆時自動移除標註
// @name:zh-CN           Discord 回復时自动移除标注
// @name:ja              Discord 返信時にメンションを自動的に削除
// @description          Discord Auto remove mention when reply.
// @description:zh-TW    Discord 回覆時自動移除標註。
// @description:zh-CN    Discord 回復时自动移除标注。
// @description:ja       Discord 返信時にメンションを自動的に削除。
// @copyright            2022, HrJasn (https://greasyfork.org/zh-TW/users/142344-jasn-hr)
// @license              GPL-3.0-or-later
// @version              1.0
// @icon                 https://www.google.com/s2/favicons?domain=discord.com
// @include              http*://discord.com/*
// @exclude              http*://www.google.com/*
// @grant                none
// ==/UserScript==

console.log("Discord Auto remove mention when reply.");

window.addEventListener('load', () =>{

    //Edit white list in 'userReplyWithoutMentionList' with array.
    //在'userReplyWithoutMentionList'內用陣列方式編輯白名單
    //在'userReplyWithoutMentionList'内用阵列方式编辑白名单
    //'userReplyWithoutMentionList'のホワイトリストを配列で編集します。
    const userReplyWithoutMentionList = [
        '*'
    ];

    let messageLocalize = (messageJson) => {
        let userLocale = navigator.userLanguage || navigator.language || navigator.browserLanguage || navigator.systemLanguage
        return messageJson[userLocale];
    }

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
                addedNode.querySelectorAll('div[class*="replyBar"]').forEach((singleRow)=>{
                    userReplyWithoutMentionList.forEach((WithoutUser)=>{
                        let consoleMessage = {
                            'en':'Remove reply ' + WithoutUser + '\'s mention in Discord.',
                            'zh-TW':'移除 Discord 回覆 ' + WithoutUser + ' 的標註',
                            'zh-CN':'移除 Discord 回復 ' + WithoutUser + ' 的标注',
                            'ja': 'Discordでの返信 ' + WithoutUser + ' の言及を削除する'
                        }
                        if(WithoutUser == '*'){
                            let mentionButton = singleRow.querySelector('div[class*="mentionButton"]');
                            if(mentionButton.parentNode.getAttribute('aria-checked') == 'true'){
                                console.log(messageLocalize(consoleMessage));
                                mentionButton.click();
                            }
                        }else if(singleRow.innerText.match(new RegExp(WithoutUser.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))){
                            let mentionButton = singleRow.querySelector('div[class*="mentionButton"]');
                            if(mentionButton.parentNode.getAttribute('aria-checked') == 'true'){
                                console.log(messageLocalize(consoleMessage));
                                mentionButton.click();
                            }
                        }
                    });
                });
            }
        });
    }
});
