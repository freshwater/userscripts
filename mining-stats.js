// ==UserScript==
// @name         Mining Stats
// @namespace    https://gazellegames.net/
// @version      1.0.1-alpha.8
// @description  Calculates statistics based on mines and 'actual IRC line' count
// @match        https://gazellegames.net/user.php?id=*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
  'use strict';
  const userId = new URLSearchParams(window.location.search).get('id');
  if (!userId || document.getElementById('tip_user')) return;

  const header = document.getElementById('username');
  if (!header) return;

  const btn = document.createElement('button');
  btn.textContent = 'Mining Stats';
  Object.assign(btn.style, { marginLeft: '8px', border: '1px solid white', cursor: 'pointer' });

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
          ['nayru', 'din', 'farore'].forEach(flame => msg.includes(`${flame}'s flame`) && acc[flame]++);
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
