// ==UserScript==
// @name         GGn Mining Stats
// @description  Adds a button to the userlog page to calculate personal mining drops statistics.
// @namespace    https://gazellegames.net/
// @version      1.0.4.1
// @match        https://gazellegames.net/user.php?action=userlog
// @grant        GM_setValue
// @grant        GM_getValue
// @icon         https://gazellegames.net/favicon.ico
// @supportURL   https://github.com/freshwater/userscripts
// ==/UserScript==

(function() {
  'use strict';
  const userLink = document.querySelector('h2 a.username');
  if (!userLink) return;
  const href = userLink.getAttribute('href');
  const userId = new URL(href, window.location.href).searchParams.get('id');
  if (!userId) return;

  const header = document.querySelector('h2');
  if (!header) return;

  const btn = document.createElement('button');
  btn.textContent = 'Mining Stats';
  Object.assign(btn.style, {
    marginLeft: '8px',
    border: '1px solid white',
    cursor: 'pointer'
  });

  btn.addEventListener('click', async () => {
    let apiKey = GM_getValue('mining_stats_api_key');
    let needsRetry = false;

    do {
      try {
        if (!apiKey) {
          apiKey = prompt('Enter your API key (requires "User" permissions):');
          if (!apiKey) return;
          GM_setValue('mining_stats_api_key', apiKey);
        }

        console.log('[Mining Stats] Fetching data...');
        const [logData, userData] = await Promise.all([
          fetchData(`https://gazellegames.net/api.php?request=userlog&limit=-1&search=as an irc reward.`, apiKey),
          fetchData(`https://gazellegames.net/api.php?request=user&id=${userId}`, apiKey)
        ]);

        const drops = logData?.response || [];
        const flameEntries = drops.filter(e => e.message.toLowerCase().includes('flame'));
        const flameCounts = flameEntries.reduce((acc, entry) => {
          const msg = entry.message.toLowerCase();
          ['nayru', 'din', 'farore'].forEach(flame => {
            if (msg.includes(`${flame}'s flame`)) acc[flame]++;
          });
          return acc;
        }, { nayru: 0, din: 0, farore: 0 });

        const actualLines = userData?.response?.community?.ircActualLines ?? 0;
        const totalMines = drops.length;
        const totalFlames = flameEntries.length;

        alert(`Mining Stats:
          Mines: ${totalMines} | Flames: ${totalFlames}
          Nayru: ${flameCounts.nayru}, Din: ${flameCounts.din}, Farore: ${flameCounts.farore}
          Lines/Mine: ${(actualLines / (totalMines || 1)).toFixed(2)}
          Lines/Flame: ${(actualLines / (totalFlames || 1)).toFixed(2)}`
          .replace(/ {2,}/g, ''));

        needsRetry = false;
      } catch (error) {
        console.error('[Mining Stats] Error:', error);
        if ([401, 403].includes(error.status)) {
          GM_setValue('mining_stats_api_key', '');
          apiKey = null;
          needsRetry = confirm(`API Error: ${error.status === 401 ? 'Invalid key' : 'No permissions'}. Retry?`);
        } else {
          alert(`Error: ${error.message}`);
          needsRetry = false;
        }
      }
    } while (needsRetry);
  });

  async function fetchData(url, apiKey) {
    const response = await fetch(url, { headers: { 'X-API-Key': apiKey } });
    if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
    const data = await response.json();
    if (data?.status !== 'success') throw new Error(data?.error || 'API request failed');
    return data;
  }

  header.appendChild(btn);
})();
