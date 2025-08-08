(() => {
  const passwordDisplay = document.getElementById('password-display');
  const lengthRange = document.getElementById('length-range');
  const lengthValue = document.getElementById('length-value');

  const includeLower = document.getElementById('include-lowercase');
  const includeUpper = document.getElementById('include-uppercase');
  const includeNumbers = document.getElementById('include-numbers');
  const includeSymbols = document.getElementById('include-symbols');

  const generateBtn = document.getElementById('generate-btn');
  const copyBtn = document.getElementById('copy-btn');
  const strengthIndicator = document.getElementById('strength-indicator');

  const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
  const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const NUMBER_CHARS = '0123456789';
  const SYMBOL_CHARS = '!@#$%^&*()-_=+[]{}|;:,.<>/?';

  lengthRange.addEventListener('input', () => {
    lengthValue.textContent = lengthRange.value;
  });

  function getRandomChar(str) {
    return str.charAt(Math.floor(Math.random() * str.length));
  }

  function generatePassword() {
    let length = parseInt(lengthRange.value, 10);
    let characterPool = '';

    if (includeLower.checked) characterPool += LOWERCASE_CHARS;
    if (includeUpper.checked) characterPool += UPPERCASE_CHARS;
    if (includeNumbers.checked) characterPool += NUMBER_CHARS;
    if (includeSymbols.checked) characterPool += SYMBOL_CHARS;

    if (!characterPool) {
      alert('Please select at least one character type!');
      return '';
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += getRandomChar(characterPool);
    }

    return password;
  }

  generateBtn.addEventListener('click', () => {
    const newPassword = generatePassword();
    if (newPassword) {
      passwordDisplay.value = newPassword;
      passwordDisplay.focus();
      passwordDisplay.select();
      updateStrengthIndicator(newPassword);
    }
  });

  copyBtn.addEventListener('click', () => {
    passwordDisplay.select();
    document.execCommand('copy');
    alert('Password copied to clipboard!');
  });

  function updateStrengthIndicator(password) {
    let strength = 'Weak';
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
      strength = 'Strong';
    } else if (password.length >= 8) {
      strength = 'Medium';
    }
    strengthIndicator.textContent = `Strength: ${strength}`;
  }
})();
