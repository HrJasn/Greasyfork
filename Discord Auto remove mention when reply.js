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
// @version              1.1
// @icon                 https://www.google.com/s2/favicons?domain=discord.com
// @include              http*://discord.com/*
// @exclude              http*://www.google.com/*
// @grant                none
// ==/UserScript==

console.log("Discord Auto remove mention when reply.");

window.addEventListener('load', () =>{

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

        let setCookie = (name,value,days) => {
            var expires = "";
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days*24*60*60*1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + (value || "")  + expires + "; path=/";
        }
        let getCookie=(name) =>{
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        }
        let eraseCookie=(name) =>{
            document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }

        addedNodes.forEach((addedNode)=>{
            if(addedNode.querySelectorAll){
                addedNode.querySelectorAll('div[class*="replyBar"]').forEach((singleRow)=>{
                    let MentionName = singleRow.querySelector('div[class*="replyLabel"] span[class*="name"]').innerText;
                    let mentionButton = singleRow.querySelector('div[class*="mentionButton"]');

                    function getAutoRemoveMentionUserList(){
                        let UserListArr = [];
                        try{
                            let AutoRemoveMentionUserListCookie = getCookie('AutoRemoveMentionUserList');
                            UserListArr = JSON.parse(AutoRemoveMentionUserListCookie);
                        }catch(err){
                        }
                        if(!UserListArr){UserListArr = [];}
                        return UserListArr;
                    }
                    function findMentionUserList(UserList,UserName){
                        return UserList.find(u => {
                            return u.name == UserName
                        })
                    }
                    function removeFromMentionUserList(UserList,UserName){
                        return UserList.filter(u => {
                            if (u.name == UserName) {
                                return false;
                            }
                            return true;
                        })
                    }

                    function closeMention(){
                        if(mentionButton.parentNode.getAttribute('aria-checked') == 'false'){
                            mentionButton.click();
                        }
                    }
                    function openMention(){
                        if(mentionButton.parentNode.getAttribute('aria-checked') == 'true'){
                            mentionButton.click();
                        }
                    }
                    function loadAutoRemoveSetting(){
                        let AutoRemoveMentionUserList = getAutoRemoveMentionUserList();
                        let MentionName = singleRow.querySelector('div[class*="replyLabel"] span[class*="name"]').innerText;
                        if(!findMentionUserList(AutoRemoveMentionUserList,MentionName)){
                            mentionButton.parentNode.parentNode.querySelector('#AutoRemoveMentionButtonOn').style.display = 'none';
                            mentionButton.parentNode.parentNode.querySelector('#AutoRemoveMentionButtonOff').style.display = 'block';
                            closeMention();
                        } else {
                            mentionButton.parentNode.parentNode.querySelector('#AutoRemoveMentionButtonOff').style.display = 'none';
                            mentionButton.parentNode.parentNode.querySelector('#AutoRemoveMentionButtonOn').style.display = 'block';
                            openMention();
                        }
                    }
                    let closeMentionEvent = ()=>{
                        let MentionName = singleRow.querySelector('div[class*="replyLabel"] span[class*="name"]').innerText;
                        mentionButton.parentNode.parentNode.querySelector('#AutoRemoveMentionButtonOn').style.display = 'none';
                        mentionButton.parentNode.parentNode.querySelector('#AutoRemoveMentionButtonOff').style.display = 'block';
                        let AutoRemoveMentionUserList = getAutoRemoveMentionUserList();
                        if(findMentionUserList(AutoRemoveMentionUserList,MentionName)){
                            let newAutoRemoveMentionUserList = removeFromMentionUserList(AutoRemoveMentionUserList,MentionName);
                            setCookie('AutoRemoveMentionUserList',JSON.stringify(newAutoRemoveMentionUserList),null);
                            newAutoRemoveMentionUserList = [];
                        }
                        loadAutoRemoveSetting();
                        console.log(getAutoRemoveMentionUserList());
                    }
                    let openMentionEvent = () => {
                        let MentionName = singleRow.querySelector('div[class*="replyLabel"] span[class*="name"]').innerText;
                        mentionButton.parentNode.parentNode.querySelector('#AutoRemoveMentionButtonOff').style.display = 'none';
                        mentionButton.parentNode.parentNode.querySelector('#AutoRemoveMentionButtonOn').style.display = 'block';
                        let AutoRemoveMentionUserList = getAutoRemoveMentionUserList();
                        if(!findMentionUserList(AutoRemoveMentionUserList,MentionName)){
                            let newUser = JSON.parse(JSON.stringify({'name':MentionName}));
                            AutoRemoveMentionUserList.push(newUser);
                            setCookie('AutoRemoveMentionUserList',JSON.stringify(AutoRemoveMentionUserList),null);
                        }
                        loadAutoRemoveSetting();
                        console.log(getAutoRemoveMentionUserList());
                    }
                    let AutoRemoveMentionButtonNameArray = {
                        'en':'@Auto remove this people\'s reply mention',
                        'zh-TW':'@自動移除此人的回覆標註',
                        'zh-CN':'@自动移除此人的回復标注',
                        'ja': '@この人の返信の言及を自動的に削除します'
                    }
                    if(mentionButton.parentNode.getAttribute('aria-checked') == 'true'){
                        let AutoRemoveMentionButtonOn = mentionButton.parentNode.parentNode.insertBefore(mentionButton.parentNode.cloneNode(true),mentionButton.parentNode);
                        AutoRemoveMentionButtonOn.id = 'AutoRemoveMentionButtonOn';
                        AutoRemoveMentionButtonOn.querySelector('div[class*="mentionButton"]').textContent = messageLocalize(AutoRemoveMentionButtonNameArray);
                        AutoRemoveMentionButtonOn.addEventListener('click',closeMentionEvent,false);
                    } else {
                        let AutoRemoveMentionButtonOff = mentionButton.parentNode.parentNode.insertBefore(mentionButton.parentNode.cloneNode(true),mentionButton.parentNode);
                        AutoRemoveMentionButtonOff.id = 'AutoRemoveMentionButtonOff';
                        AutoRemoveMentionButtonOff.querySelector('div[class*="mentionButton"]').textContent = messageLocalize(AutoRemoveMentionButtonNameArray);
                        AutoRemoveMentionButtonOff.addEventListener('click',openMentionEvent,false);
                    }
                    mentionButton.click();
                    if(mentionButton.parentNode.getAttribute('aria-checked') == 'true'){
                        let AutoRemoveMentionButtonOn = mentionButton.parentNode.parentNode.insertBefore(mentionButton.parentNode.cloneNode(true),mentionButton.parentNode);
                        AutoRemoveMentionButtonOn.id = 'AutoRemoveMentionButtonOn';
                        AutoRemoveMentionButtonOn.querySelector('div[class*="mentionButton"]').textContent = messageLocalize(AutoRemoveMentionButtonNameArray);
                        AutoRemoveMentionButtonOn.style.display = 'none';
                        AutoRemoveMentionButtonOn.addEventListener('click',closeMentionEvent,false);
                    } else {
                        let AutoRemoveMentionButtonOff = mentionButton.parentNode.parentNode.insertBefore(mentionButton.parentNode.cloneNode(true),mentionButton.parentNode);
                        AutoRemoveMentionButtonOff.id = 'AutoRemoveMentionButtonOff';
                        AutoRemoveMentionButtonOff.querySelector('div[class*="mentionButton"]').textContent = messageLocalize(AutoRemoveMentionButtonNameArray);
                        AutoRemoveMentionButtonOff.style.display = 'none';
                        AutoRemoveMentionButtonOff.addEventListener('click',openMentionEvent,false);
                    }
                    let messagesWrapper = mentionButton.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.querySelector('div[class*="messagesWrapper"]');
                    messagesWrapper.addEventListener('click',loadAutoRemoveSetting,false);
                    messagesWrapper.click();
                });
            }
        });
    }
});
