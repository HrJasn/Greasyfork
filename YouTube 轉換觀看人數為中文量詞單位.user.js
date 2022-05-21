// ==UserScript==

// @name YouTube 轉換觀看人數為中文量詞單位
// @copyright 2019, HrJasn (https://openuserjs.org/users/a29527806)
// @license GPL-3.0-or-later
// @icon
// @homepageURL https://openuserjs.org/users/a29527806
// @supportURL https://openuserjs.org/users/a29527806
// @contributionURL https://openuserjs.org/users/a29527806
// @version 1.1.2
// @updateURL https://openuserjs.org/meta/a29527806/YouTube_轉換觀看人數為中文量詞單位.meta.js
// @downloadURL https://openuserjs.org/install/a29527806/YouTube_轉換觀看人數為中文量詞單位.user.js
// @namespace https://openuserjs.org/users/a29527806
// @grant		  none
// @include		http*://www.youtube.com/*
// @exclude		http*://www.google.com/*

// ==/UserScript==

// ==OpenUserJS==
// @author a29527806
// ==/OpenUserJS==


console.log('YouTube 轉換觀看人數為中文量詞單位');

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
                addedNode.querySelectorAll('#primary .view-count').forEach((singleRow)=>{
                    const viewCount = singleRow.innerText.match(/觀看次數：([0-9,]+)次/);
                    if(viewCount){
                        const viewCountNumber = viewCount[1].replace(/,/g,'');
						singleRow.innerHTML = '觀看次數：' + transferToChineseNumber(viewCountNumber) + '次';
                    }
                });
            }
        });
    }

	function transferToChineseNumber(srcNumber){
		let Number_toReplace = '';
		const number_Units = ["萬","億","兆","京","垓","秭","穰","溝","澗","正","載","極","恆河沙","阿僧祇","那由他","不可思議","無量大數"];
		for (let len = srcNumber.length , i = len ; i > 0; i -= 1) {
			if ( ( (len-i) % 4 === 0 ) && (number_Units[(len-i)/4-1]) ) {
				Number_toReplace = number_Units[(len-i)/4-1] + Number_toReplace;
			}
			Number_toReplace = String(srcNumber[i-1]) + Number_toReplace;
		}
		return Number_toReplace;
	}

});
