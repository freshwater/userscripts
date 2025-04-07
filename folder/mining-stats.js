// ==UserScript==
// @name         Mining Stats
// @namespace    https://gazellegames.net/
// @version      1.0.0-alpha.4
// @description  Calculates statistics based on mines and 'actual IRC line' count.
// @match        https://gazellegames.net/user.php?id=*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  const userId = new URLSearchParams(window.location.search).get('id');
  if (!userId || document.getElementById('tip_user')) return;

  const header = document.getElementById('username');
  if (!header) return;

  const btn = document.createElement('button');
  btn.textContent = 'Mining Stats';
  btn.style.marginLeft = '8px';
  btn.style.border = '1px solid white';
  btn.addEventListener('click', async () => {
    let apiKey = localStorage.getItem('mining_stats_api_key') || prompt('Enter your API key (requires "User" permissions):');
    if (!apiKey) return;
    localStorage.setItem('mining_stats_api_key', apiKey);

    async function safeFetch(url) {
      const res = await fetch(url, { method: 'GET', headers: { 'X-API-Key': apiKey } });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res.json();
    }

    try {
      const logData = await safeFetch(`https://gazellegames.net/api.php?request=userlog&search=as an irc reward.`);
      const drops = logData.response || [];
      const flameEntries = drops.filter(e => e.message.toLowerCase().includes('flame'));
      const flameCounts = { nayru: 0, din: 0, farore: 0 };
      flameEntries.forEach(entry => {
        const msg = entry.message.toLowerCase();
        if (msg.includes("nayru's flame")) flameCounts.nayru++;
        if (msg.includes("din's flame")) flameCounts.din++;
        if (msg.includes("farore's flame")) flameCounts.farore++;
      });

      const userData = await safeFetch(`https://gazellegames.net/api.php?request=user&id=${userId}`);
      const actualLines = userData.response?.community?.ircActualLines;
      if (typeof actualLines !== 'number') throw new Error('ircActualLines not found');

      const totalMines = drops.length, totalFlames = flameEntries.length;
      const linesPerMine = (actualLines / (totalMines || 1)).toFixed(2);
      const linesPerFlame = (actualLines / (totalFlames || 1)).toFixed(2);

      alert(`Mines: ${totalMines} | Flames: ${totalFlames} (Nayru: ${flameCounts.nayru}, Din: ${flameCounts.din}, Farore: ${flameCounts.farore})\nLines per Mine: ${linesPerMine} | Lines per Flame: ${linesPerFlame}`);
    }
  });

  header.appendChild(btn);
})();
