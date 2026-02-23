import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://yhrfzhwjheuavmsiielj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlocmZ6aHdqaGV1YXZtc2lpZWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTY1ODksImV4cCI6MjA4NzI5MjU4OX0.0tHWAWqwOTs8Bw4_AtDUEOZGhuM_y0Oukm-t-BzPano';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const form = document.getElementById('signup-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('signup-password');
const confirmInput = document.getElementById('signup-confirm');
const generateBtn = document.getElementById('generate-username');
const submitBtn = form.querySelector('button[type="submit"]');

// Word lists for username generation
const adjectives = ['Cool', 'Happy', 'Silly', 'Wild', 'Crazy', 'Sleepy', 'Bubbly', 'Jolly', 'Mighty', 'Shiny' , 'bob'];
const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox', 'Wolf', 'Bear', 'Owl', 'Lion', 'Zebra'];

function showMessage(msg, isError = false) {
  alert(msg);
}

async function isUsernameTaken(username) {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('username', username);
  if (error) throw error;
  return count > 0;
}

// Generate a random username (adjective + noun + random number)
function generateRandomUsername() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100-999
  return `${adj}${noun}${num}`;
}

// Generate a unique username (max 10 attempts)
async function generateUniqueUsername() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateRandomUsername();
    const taken = await isUsernameTaken(candidate);
    if (!taken) return candidate;
  }
  // Fallback – add timestamp
  return `User${Date.now().toString().slice(-6)}`;
}

// Generate button click handler
generateBtn.addEventListener('click', async () => {
  generateBtn.disabled = true;
  const originalInner = generateBtn.innerHTML;
  generateBtn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';
  
  try {
    const username = await generateUniqueUsername();
    usernameInput.value = username;
  } catch (error) {
    console.error('Error generating username:', error);
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = originalInner;
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  if (!username || !email || !password || !confirm) {
    showMessage('Please fill in all fields', true);
    return;
  }

  if (password !== confirm) {
    showMessage('Passwords do not match', true);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  try {
    // Check if username is already taken
    const taken = await isUsernameTaken(username);
    if (taken) {
      showMessage('Username is already taken. Try generating another!', true);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Start Bubli-ing!';
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (error) throw error;

    if (data.session) {
      window.location.href = 'setup.html';
    } else {
      showMessage('Account created! Please check your email to confirm your account.');
      setTimeout(() => window.location.href = 'signin.html', 3000);
    }
  } catch (error) {
    showMessage('Signup failed: ' + error.message, true);
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Start Bubli-ing!';
  }
});