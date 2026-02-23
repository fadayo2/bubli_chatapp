import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://yhrfzhwjheuavmsiielj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlocmZ6aHdqaGV1YXZtc2lpZWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTY1ODksImV4cCI6MjA4NzI5MjU4OX0.0tHWAWqwOTs8Bw4_AtDUEOZGhuM_y0Oukm-t-BzPano';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get form and inputs
const form = document.getElementById('signin-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('signin-password');
const submitBtn = form.querySelector('button[type="submit"]');

// Helper to show messages (replace with a toast later)
function showMessage(msg, isError = false) {
  alert(msg);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage('Please fill in both fields', true);
    return;
  }

  // Disable button to prevent double submission
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    showMessage('Login successful! Redirecting to chat...');
    
    // Redirect to the main chat page (create this later)
    setTimeout(() => {
      window.location.href = 'chat.html';
    }, 1500);

  } catch (error) {
    showMessage('Login failed: ' + error.message, true);
    console.error(error);
  } finally {
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log in to Bubli';
  }
});