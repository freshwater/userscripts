// ==UserScript==
// @name         GGn TheLounge Trading Swap
// @description  Based of ZeDoCaixao's script; will flip jesterrace's #Trading [Have] & [Want] for TheLounge instances.
// @namespace    https://gazellegames.net
// @version      2.0
// @match        https://yourTheLounge.url/*
// @grant        none
// @icon         https://gazellegames.net/favicon.ico
// @supportURL   https://github.com/freshwater/userscripts
// ==/UserScript==

(function() {
    'use strict';

    function flipTradeContent(contentElement) {
        const nodes = Array.from(contentElement.childNodes);
        let wantStart = -1;
        let haveStart = -1;

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const text = node.textContent || "";

            if (wantStart === -1 && /\[WANT\]/i.test(text)) {
                wantStart = i;
            }

            if (haveStart === -1 && /\[HAVE\]/i.test(text)) {
                haveStart = i;
                break;
            }
        }

        if (wantStart === -1 || haveStart === -1 || wantStart >= haveStart) {
            return false;
        }

        const beforeWant = nodes.slice(0, wantStart);
        const wantSection = nodes.slice(wantStart, haveStart);
        const haveSection = nodes.slice(haveStart);

        const spaceNode = document.createTextNode(' ');

        const newContent = [
            ...beforeWant,
            ...haveSection,
            spaceNode,
            ...wantSection
        ];

        while (contentElement.firstChild) {
            contentElement.removeChild(contentElement.firstChild);
        }

        newContent.forEach(node => {
            contentElement.appendChild(node);
        });

        return true;
    }

    function processMessageElement(element) {
        const userElem = element.querySelector(
            '.user, .username, .sender, .nick, .author, .by'
        );
        if (!userElem) return;

        const username = userElem.textContent.trim();
        if (!username.includes('jesterrace')) return;

        const contentElem = element.querySelector(
            '.content, .text, .message, .msg, .body'
        );
        if (!contentElem) return;

        flipTradeContent(contentElem);
    }

    function handleNewMessages(mutations) {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== 1) continue;

                if (node.matches('.message, .msg, .chat-line')) {
                    processMessageElement(node);
                }
                const messages = node.querySelectorAll('.message, .msg, .chat-line');
                messages.forEach(processMessageElement);
            }
        }
    }

    const observer = new MutationObserver(handleNewMessages);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    document.querySelectorAll('.message, .msg, .chat-line').forEach(processMessageElement);
})();
