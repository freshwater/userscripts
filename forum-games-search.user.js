// ==UserScript==
// @name         GGn Forum Games Search
// @description  Adds a search box below the last post on various forum game threads.
// @namespace    https://gazellegames.net/
// @version      1.2.1
// @match        https://gazellegames.net/forums.php*
// @grant        none
// @icon         https://gazellegames.net/favicon.ico
// @supportURL   https://github.com/freshwater/userscripts
// ==/UserScript==

(function() {
    'use strict';
    console.log("Userscript loaded on a GazelleGames forums page.");

    if (window.location.href.indexOf("threadid=29022") !== -1 || window.location.href.indexOf("threadid=21488") !== -1) {
        console.log("Target thread detected. Executing script actions.");

        window.addEventListener('load', () => {
            console.log("Page fully loaded. Searching for post content.");

            const postElements = document.querySelectorAll("div[id^='content']");
            console.log(`Found ${postElements.length} post(s) on the page.`);

            if (postElements.length > 1) {
                let secondToLastValidPost = null;
                for (let i = postElements.length - 2; i >= 0; i--) {
                    const postText = postElements[i].textContent.trim();
                    if (postText.length > 0) {
                        secondToLastValidPost = postElements[i];
                        break;
                    }
                }

                if (secondToLastValidPost) {
                    console.log("Found second-to-last valid post. Appending search box after it.");

                    const searchBoxContainer = document.createElement('div');
                    searchBoxContainer.style.marginTop = '20px';
                    const searchBoxLabel = document.createElement('label');
                    searchBoxLabel.setAttribute('for', 'searchBox');
                    searchBoxContainer.appendChild(searchBoxLabel);

                    const searchBox = document.createElement('input');
                    searchBox.setAttribute('type', 'text');
                    searchBox.setAttribute('id', 'searchBox');
                    searchBox.setAttribute('placeholder', 'Search...');
                    searchBox.style.width = '50%';
                    searchBox.style.padding = '8px';
                    searchBox.style.border = '1px solid #ccc';
                    searchBox.style.borderRadius = '4px';
                    searchBoxContainer.appendChild(searchBox);

                    secondToLastValidPost.appendChild(searchBoxContainer);

                    searchBox.addEventListener('keydown', function(event) {
                        if (event.key === 'Enter') {
                            const query = searchBox.value.trim().replace(/\s+/g, ' ');

                            const searchURL = `https://gazellegames.net/torrents.php?artistname=&action=advanced&groupname=${encodeURIComponent(query)}&year=&remastertitle=&remasteryear=&releasetitle=&releasegroup=&filelist=&sizesmall=&sizelarge=&userrating=&metarating=&ignrating=&gsrating=&encoding=&format=&region=&language=&rating=&miscellaneous=&scene=&dupable=&freetorrent=&checked=&gamedox=&gamedoxvers=&taglist=!adult&order_by=relevance&order_way=desc&empty_groups=both&filter_cat[1]=1`;

                            window.open(searchURL, '_blank');
                        }
                    });
                }
            } else {
                console.log("Not enough posts found on this page.");
            }
        });
    } else {
        console.log("This page is not the target thread. No further actions will be executed.");
    }
})();
