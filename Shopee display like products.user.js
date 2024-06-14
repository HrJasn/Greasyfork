// ==UserScript==

// @name               Shopee shopping cart display liked products
// @name:zh-TW         蝦皮購物車顯示喜愛的商品
// @name:zh-CN         虾皮购物车显示喜爱的商品
// @description        Products that have been liked are displayed below the Shopee shopping cart.
// @description:zh-TW  在蝦皮購物車下方顯示已按過喜歡的商品。
// @description:zh-CN  在虾皮购物车下方显示已按过喜欢的商品。
// @copyright          2024, HrJasn (https://greasyfork.org/zh-TW/users/142344-jasn-hr)
// @license            MIT
// @icon               https://www.google.com/s2/favicons?domain=shopee.tw
// @homepageURL        https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @supportURL         https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @version            1
// @namespace          https://greasyfork.org/zh-TW/users/142344-jasn-hr
// @grant              none
// @match              http*://shopee.tw
// @match              http*://shopee.tw/*

// ==/UserScript==

(() => {
    window.addEventListener('load',() => {
        let LikedItemsMaxCount = "20";
        let observer;
        observer = new MutationObserver( (mutations) => {
            mutations.forEach((adNds)=>{
                adNds.addedNodes.forEach(async (adNde)=>{
                    if( (adNde) && (adNde.classList) && (adNde.classList.contains("shopee-header-section")) ){
                        console.log(adNde);
                        let userLang = navigator.language || navigator.userLanguage;
                        let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

                        let liked_items = await fetch("https://shopee.tw/api/v4/pages/get_liked_items?category_ids=&cursor=0&keyword=&limit=" + LikedItemsMaxCount + "&offset=0&status=0", {
                            "method": "GET",
                            "headers": {
                                "x-api-source": "rn",
                                "x-shopee-language": userLang,
                                "x-shopee-client-timezone": userTimezone,
                                "user-agent": "Android app Shopee appver=32511 app_type=1 platform=native_android os_ver=30 Cronet/102.0.5005.61",
                                "accept-encoding": "gzip, deflate, br"
                            }
                        }).then((response) => {
                            return response.json();
                        }).then((json) => {
                            return json;
                        });

                        for (let lin = 0; lin < liked_items.data.items.length; lin++) {
                            let lio = liked_items.data.items[lin];
                            let itemname = lio.name;
                            let contenthref = "/" + itemname + "-i." + lio.shopid + "." + lio.itemid;
                            let imgid = lio.image;
                            let itemprice = lio.price / 100000;
                            let NewDiv = await AddLikedItem(itemname, contenthref, imgid, itemprice);
                            console.log(NewDiv);
                        };

                        async function AddLikedItem(itemname, contenthref, imgid, itemprice){
                            const likelist = [...document.querySelectorAll('div.shopee-header-section')].find((e)=>{return e.innerText.match(/喜歡|like/)}).nextSibling;
                            let NewDiv = likelist.insertBefore(document.createElement("div"), likelist.firstChild);
                            NewDiv.classList.add("N_YeYe");
                            NewDiv.insertAdjacentHTML('afterbegin', `
								<div class="shopee_ic" style="display: contents;">
									<a class="contents" href="` + contenthref + `">
										<div class="flex flex-col bg-white cursor-pointer h-full h-full duration-100 ease-sharp-motion-curve hover:shadow-hover active:shadow-active hover:-translate-y-[1px] active:translate-y-0 relative hover:z-[1] border border-shopee-black9">
											<div class="relative z-0 w-full pt-full" style="box-shadow: inset 0px 10px 50px orange;">
												<img src="https://down-tw.img.susercontent.com/file/` + imgid + `_tn.webp" alt="` + itemname + `" class="inset-y-0 w-full h-full pointer-events-none object-contain absolute" loading="lazy" aria-hidden="true" style="width:190px; height:190px;">
													<div class="p-2 flex-1 flex flex-col justify-between">
														<div class="mb-1 whitespace-normal line-clamp-2 break-words min-h-[2.5rem] text-sm">` + itemname + `</div>
														<div class="flex justify-between items-center space-x-1">
															<div class="max-w-full flex-grow-1 flex-shrink-0 truncate text-shopee-primary flex items-center font-medium">
																<span aria-label="promotion price"/>
																<div class="truncate flex items-baseline">
																	<span class="text-xs/sp14">$</span>
																	<span class="text-base/5 truncate">` + itemprice + `</span>
																	<span class="text-xs/sp14"/>
																</div>
															</div>
														</div>
													</div>
												</div>
											</a>
										</div>
							`);
                            return NewDiv;
                        };
                        observer.disconnect();
                    };
                });
            });
        });
        observer.observe(document, {attributes:true, childList:true, subtree:true});
    });
})();