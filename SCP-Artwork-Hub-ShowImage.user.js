// ==UserScript==
// @namespace    https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @name               SCP Artwork Hub Move Mouse To Show Image
// @name:zh-TW         SCP 移動滑鼠到文藝中心貼文連結上以顯示圖片
// @name:zh-CN         SCP 移动鼠标到文艺中心贴文连结上以显示图档
// @name:ja            SCP Arts Centerの投稿リンクの上にマウスを移動して、画像を表示します
// @description        SCP Artwork Hub Move Mouse To Show Image.
// @description:zh-TW  SCP 移動滑鼠到文藝中心貼文連結上以顯示圖片。
// @description:zh-CN  SCP 移动鼠标到文艺中心贴文连结上以显示图档。
// @description:ja     SCP Arts Centerの投稿リンクの上にマウスを移動して、画像を表示します。
// @copyright    2022, HrJasn (https://greasyfork.org/zh-TW/users/142344-jasn-hr)
// @license      GPL-3.0-or-later
// @version      1.3.1
// @icon         https://www.google.com/s2/favicons?domain=wikidot.com
// @include      http*://*scp*.wikidot.com/*art*
// @include      http://ko.scp-wiki.net/scp-artwork-hub-ko
// @grant        none
// ==/UserScript==

window.onload = function(){

    const ArtImageWindow = document.body.appendChild(document.createElement('img'));
    ArtImageWindow.style = 'position:fixed;right:5px;bottom:5px;border:0px;max-height:20%;max-width:20%;background-color:white;';
    ArtImageWindow.style.display = 'none';
    ArtImageWindow.addEventListener('mouseleave',function(e){
        ArtImageWindow.style.display = 'none';
        ArtImageWindow.style.right = '0px';
        ArtImageWindow.style.bottom = '0px';
        ArtImageWindow.src = '';
    });

    const loadImage = function(e){
        e.target.style.cursor = 'wait';
        let fetchURL = e.target.href;
        fetchURL = fetchURL.replace(/^(https?:\/\/[^\/]+\/adult:.*)$/,"$1/noredirect/true");
        fetch(fetchURL,{method:'GET',}).then(function(res){
            return res.text();
        }).then(function(resText){
            let parser = new DOMParser();
            let resDom = parser.parseFromString(resText,"text/html");
            let resDomBody = resDom.body;
            let ArtworkImage = resDomBody.querySelector('#page-content div.image-container img') ||
                [...resDomBody.querySelectorAll('#page-content img.image')].at(-1) ||
                resDomBody.querySelector('#page-content img.fillpg');
            let ArtworkImageSrc = ArtworkImage.src;
            ArtImageWindow.src = ArtworkImageSrc;
            let newright = window.innerWidth - e.clientX;
            let newbottom = window.innerHeight - e.clientY;
            ArtImageWindow.style.right = newright + 'px';
            ArtImageWindow.style.bottom = newbottom + 'px';
            ArtImageWindow.style.display = '';
            e.target.style.cursor = 'auto';
        });
    }

    const moveImage = function(e){
        let newright = window.innerWidth - e.clientX;
        let newbottom = window.innerHeight - e.clientY;
        ArtImageWindow.style.right = newright + 'px';
        ArtImageWindow.style.bottom = newbottom + 'px';
    }

    const takeoutImage = function(e){
        ArtImageWindow.style.display = 'none';
        ArtImageWindow.style.right = '0px';
        ArtImageWindow.style.bottom = '0px';
        ArtImageWindow.src = '';
    }

    let divContents = [
        document.querySelectorAll('div.content-type-description tr'),
        document.querySelectorAll('div.content-type-description-2 tr')
    ]
    let divContentTypeDescriptionTrs = divContents.reduce(function(a, b){return a.length > b.length ? a : b ;});
    for(let i=0;i<divContentTypeDescriptionTrs.length;i++){
        let artworkLinkOBJ = divContentTypeDescriptionTrs[i].querySelector('td:first-child a');
        console.log(artworkLinkOBJ);
        if(artworkLinkOBJ){
            artworkLinkOBJ.addEventListener('mouseenter',loadImage);
            artworkLinkOBJ.addEventListener('mousemove',moveImage);
            artworkLinkOBJ.addEventListener('mouseleave',takeoutImage);
        }
    }

}
