// ==UserScript==
// @name         Mining Stats
// @namespace    https://gazellegames.net/
// @version      1.0.0-alpha.8
// @description  Calculates statistics based on mines and 'actual IRC line' count.
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

        console.log('[Mining Stats] Starting data collection...');

        // Fetch mining log data
        console.log('[Mining Stats] Fetching user log...');
        const logData = await fetchWithRetry(
          `https://gazellegames.net/api.php?request=userlog&limit=-1&search=as an irc reward.`,
          apiKey
        );
        const drops = Array.isArray(logData?.response) ? logData.response : [];
        console.log(`[Mining Stats] Found ${drops.length} mining entries`);

        // Process flame data
        console.log('[Mining Stats] Analyzing flame types...');
        const flameEntries = drops.filter(e => e.message.toLowerCase().includes('flame'));
        const flameCounts = { nayru: 0, din: 0, farore: 0 };

        flameEntries.forEach(entry => {
          const msg = entry.message.toLowerCase();
          Object.keys(flameCounts).forEach(flame => {
            if (msg.includes(`${flame}'s flame`)) flameCounts[flame]++;
          });
        });

        // Fetch user statistics
        console.log('[Mining Stats] Fetching user data...');
        const userData = await fetchWithRetry(
          `https://gazellegames.net/api.php?request=user&id=${userId}`,
          apiKey
        );

        // Validate IRC lines data
        const actualLines = userData?.response?.community?.ircActualLines;
        if (typeof actualLines !== 'number') {
          throw new Error('Invalid ircActualLines data in API response');
        }

        // Calculate statistics
        console.log('[Mining Stats] Calculating metrics...');
        const totalMines = drops.length;
        const totalFlames = flameEntries.length;
        const linesPerMine = (actualLines / (totalMines || 1)).toFixed(2);
        const linesPerFlame = (actualLines / (totalFlames || 1)).toFixed(2);

        // Show results
        console.log('[Mining Stats] Final results:', {
          totalMines,
          totalFlames,
          flameCounts,
          linesPerMine,
          linesPerFlame
        });

        alert(
          `Mines: ${totalMines} | Flames: ${totalFlames}\n` +
          `Nayru: ${flameCounts.nayru}, Din: ${flameCounts.din}, Farore: ${flameCounts.farore}\n` +
          `Lines/Mine: ${linesPerMine} | Lines/Flame: ${linesPerFlame}`
        );

        needsRetry = false;
      } catch (error) {
        console.error('[Mining Stats] Error:', error);

        // Handle API key errors
        if (error.status === 401 || error.status === 403) {
          alert(`API Error (${error.status}): ${error.status === 401 ? 'Invalid key' : 'Insufficient permissions'}\nPlease provide a new API key.`);
          apiKey = null;
          GM_setValue('mining_stats_api_key', null);
          needsRetry = true;
        } else {
          alert(`Error: ${error.message}`);
          needsRetry = false;
        }
      }
    } while (needsRetry);
  });

  async function fetchWithRetry(url, apiKey) {
    console.log(`[Mining Stats] API request to: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-API-Key': apiKey }
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status} - ${response.statusText}`);
      error.status = response.status;
      throw error;
    }

    const data = await response.json();

    // Handle API-level errors
    if (data?.status !== 'success') {
      const errorMessage = data?.error || 'Unknown API error';
      const error = new Error(`API Error: ${errorMessage}`);
      error.status = response.status;
      throw error;
    }

    return data;
  }

  header.appendChild(btn);
})();
