// ==UserScript==

// @name YouTube 轉換觀看人數為中文量詞單位
// @copyright 2022, HrJasn (https://github.com/HrJasn/)
// @license GPL-3.0-or-later
// @icon
// @homepageURL https://github.com/HrJasn/
// @supportURL https://github.com/HrJasn/
// @contributionURL https://github.com/HrJasn/
// @version 1.1.3
// @downloadURL https://github.com/HrJasn/Greasyfork/raw/main/YouTube%20%E8%BD%89%E6%8F%9B%E8%A7%80%E7%9C%8B%E4%BA%BA%E6%95%B8%E7%82%BA%E4%B8%AD%E6%96%87%E9%87%8F%E8%A9%9E%E5%96%AE%E4%BD%8D.user.js
// @namespace https://github.com/HrJasn/
// @grant		  none
// @include		http*://www.youtube.com/*
// @exclude		http*://www.google.com/*

// ==/UserScript==


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
