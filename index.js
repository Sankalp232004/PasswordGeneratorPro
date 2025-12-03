(() => {
  const passwordDisplay = document.getElementById('password-display');
  const lengthRange = document.getElementById('length-range');
  const lengthValue = document.getElementById('length-value');
  const includeLower = document.getElementById('include-lowercase');
  const includeUpper = document.getElementById('include-uppercase');
  const includeNumbers = document.getElementById('include-numbers');
  const includeSymbols = document.getElementById('include-symbols');
  const avoidSimilar = document.getElementById('avoid-similar');
  const startLetter = document.getElementById('start-letter');
  const copyBtn = document.getElementById('copy-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const revealBtn = document.getElementById('reveal-btn');
  const strengthChip = document.getElementById('strength-chip');
  const entropyChip = document.getElementById('entropy-chip');
  const insightsList = document.getElementById('insights-list');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history');
  const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const NUMBERS = '0123456789';
  const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>/?';
  const SIMILAR = /[Il1|O0]/g;
  const MAX_HISTORY = 7;
  let currentPassword = '';
  let history = [];
  let isVisible = false;

  const secureRandom = max => {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % max;
  };

  const pick = source => source.charAt(secureRandom(source.length));

  const shuffle = chars => {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = secureRandom(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars;
  };

  const filterSimilar = str => str.replace(SIMILAR, '');

  const buildSets = () => {
    const sets = [];
    if (includeLower.checked) sets.push(LOWERCASE);
    if (includeUpper.checked) sets.push(UPPERCASE);
    if (includeNumbers.checked) sets.push(NUMBERS);
    if (includeSymbols.checked) sets.push(SYMBOLS);
    return sets;
  };

  const generatePassword = () => {
    const sets = buildSets();
    if (!sets.length) return '';
    let bank = sets.join('');
    let processedSets = sets.map(set => set);
    if (avoidSimilar.checked) {
      processedSets = processedSets.map(filterSimilar).filter(Boolean);
      bank = processedSets.join('');
    }
    if (!bank.length) return '';
    const length = Number(lengthRange.value);
    const required = processedSets.map(set => pick(set));
    const chars = [...required];
    while (chars.length < length) chars.push(pick(bank));
    if (startLetter.checked) {
      const letters = [];
      if (includeLower.checked) letters.push(avoidSimilar.checked ? filterSimilar(LOWERCASE) : LOWERCASE);
      if (includeUpper.checked) letters.push(avoidSimilar.checked ? filterSimilar(UPPERCASE) : UPPERCASE);
      const letterBank = letters.join('');
      if (letterBank) chars[0] = pick(letterBank);
    }
    return shuffle(chars).slice(0, length).join('');
  };

  const evaluateStrength = (password, poolSize) => {
    let score = 0;
    const length = password.length;
    if (length >= 16) score += 2;
    else if (length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    if (poolSize > 40) score += 1;
    if (/([a-zA-Z0-9])\1{2,}/.test(password)) score -= 1;
    if (avoidSimilar.checked) score += 1;
    let label = 'Weak';
    let tone = 'weak';
    if (score >= 5) {
      label = 'Strong';
      tone = 'strong';
    } else if (score >= 3) {
      label = 'Balanced';
      tone = 'ok';
    }
    return { label, tone };
  };

  const updateChips = password => {
    const sets = buildSets();
    let poolSize = sets.join('').length;
    if (avoidSimilar.checked) poolSize = filterSimilar(sets.join('')).length;
    const { label, tone } = evaluateStrength(password, poolSize);
    const entropy = poolSize ? Math.round(password.length * Math.log2(poolSize)) : 0;
    strengthChip.textContent = `Strength • ${label}`;
    strengthChip.dataset.tone = tone;
    const entropyTone = entropy > 140 ? 'strong' : entropy > 90 ? 'ok' : 'weak';
    entropyChip.textContent = `Entropy • ~${entropy} bits`;
    entropyChip.dataset.tone = entropyTone;
  };

  const renderInsights = password => {
    const active = [];
    if (includeLower.checked) active.push('Lowercase');
    if (includeUpper.checked) active.push('Uppercase');
    if (includeNumbers.checked) active.push('Digits');
    if (includeSymbols.checked) active.push('Symbols');
    const unique = new Set(password.split(''));
    const insights = [];
    insights.push(`Length locked at ${password.length} characters.`);
    insights.push(active.length ? `Character sets: ${active.join(' + ')}.` : 'No sets active.');
    insights.push(`Distinct glyphs used: ${unique.size}.`);
    insights.push(avoidSimilar.checked ? 'Lookalike glyphs removed for readability.' : 'Lookalike glyphs allowed for maximum entropy.');
    if (startLetter.checked) insights.push('First character anchored to a letter.');
    insightsList.innerHTML = insights.map(item => `<li>${item}</li>`).join('');
  };

  const flashField = () => {
    passwordDisplay.classList.remove('pulse');
    void passwordDisplay.offsetWidth;
    passwordDisplay.classList.add('pulse');
  };

  const syncRevealState = () => {
    passwordDisplay.type = isVisible ? 'text' : 'password';
    revealBtn.textContent = isVisible ? 'Hide password' : 'Tap to reveal';
    revealBtn.classList.toggle('active', isVisible);
  };

  const refreshPassword = () => {
    const next = generatePassword();
    if (!next) {
      historyList.innerHTML = '<p>Please enable at least one character set.</p>';
      return;
    }
    currentPassword = next;
    passwordDisplay.value = next;
    isVisible = false;
    syncRevealState();
    flashField();
    updateChips(next);
    renderInsights(next);
    pushHistory(next);
  };

  const pushHistory = value => {
    history = [{ value, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...history].slice(0, MAX_HISTORY);
    renderHistory();
  };

  const renderHistory = () => {
    if (!history.length) {
      historyList.innerHTML = '<p>No passwords yet. Generate one to start the gallery.</p>';
      return;
    }
    historyList.innerHTML = history.map((item, index) => `
      <div class="history-item">
        <span>${item.value}</span>
        <button data-copy="${item.value}" aria-label="Copy password ${index + 1}">Copy</button>
      </div>
    `).join('');
  };

  const copyToClipboard = async (value, button) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const temp = document.createElement('textarea');
        temp.value = value;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      if (button) {
        const original = button.textContent;
        button.textContent = 'Copied';
        button.disabled = true;
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = original;
          button.disabled = false;
          button.classList.remove('copied');
        }, 1500);
      }
    } catch (err) {
      alert('Clipboard unavailable.');
    }
  };

  lengthRange.addEventListener('input', () => {
    lengthValue.textContent = lengthRange.value;
  });

  lengthRange.addEventListener('change', refreshPassword);
  [includeLower, includeUpper, includeNumbers, includeSymbols, avoidSimilar, startLetter].forEach(control => control.addEventListener('change', refreshPassword));
  refreshBtn.addEventListener('click', refreshPassword);
  copyBtn.addEventListener('click', () => {
    if (!currentPassword) return;
    copyToClipboard(currentPassword, copyBtn);
  });
  historyList.addEventListener('click', event => {
    const target = event.target.closest('button[data-copy]');
    if (!target) return;
    copyToClipboard(target.dataset.copy, target);
  });
  clearHistoryBtn.addEventListener('click', () => {
    history = [];
    renderHistory();
  });
  revealBtn.addEventListener('click', () => {
    if (!currentPassword) return;
    isVisible = !isVisible;
    syncRevealState();
  });

  refreshPassword();
})();
