import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://yhrfzhwjheuavmsiielj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlocmZ6aHdqaGV1YXZtc2lpZWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTY1ODksImV4cCI6MjA4NzI5MjU4OX0.0tHWAWqwOTs8Bw4_AtDUEOZGhuM_y0Oukm-t-BzPano';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check authentication
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
if (!session) {
  window.location.href = 'signin.html';
}

// DOM elements
const form = document.getElementById('setup-form');
const usernameDisplay = document.getElementById('display-username');
const avatarPreview = document.getElementById('avatar-preview');
const submitBtn = form.querySelector('button[type="submit"]');

let selectedAvatarUrl = null;

async function loadUserInfo() {
  console.log('Loading user info for:', session.user.id);

  // Try to get existing profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('id', session.user.id)
    .maybeSingle();

  console.log('Profile fetch result:', { profile, error });

  if (profile) {
    console.log('Profile exists with username:', profile.username);
    usernameDisplay.textContent = profile.username;
    if (profile.avatar_url) {
      selectedAvatarUrl = profile.avatar_url;
      avatarPreview.src = selectedAvatarUrl;
      document.querySelectorAll('.avatar-option').forEach(opt => {
        if (opt.dataset.avatar === selectedAvatarUrl) {
          opt.classList.add('selected');
        }
      });
    }
  } else {
    // No profile – use metadata from session.user
    console.log('No profile found, checking user metadata...');
    console.log('Session user:', session.user);
    const metaUsername = session.user?.user_metadata?.username;
    console.log('Username from metadata:', metaUsername);

    if (metaUsername) {
      usernameDisplay.textContent = metaUsername;
    } else {
      // Show metadata keys for debugging
      const metadata = session.user?.user_metadata || {};
      alert(`No username found in metadata. Available keys: ${Object.keys(metadata).join(', ')}`);
      console.error('Full user metadata:', metadata);
      window.location.href = 'signup.html';
      return;
    }
  }

  // If no avatar selected, default to first option
  if (!selectedAvatarUrl) {
    const firstOption = document.querySelector('.avatar-option');
    if (firstOption) {
      selectedAvatarUrl = firstOption.dataset.avatar;
      avatarPreview.src = selectedAvatarUrl;
      firstOption.classList.add('selected');
    }
  }
}
loadUserInfo();

window.selectAvatar = function(imgElement) {
  document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
  imgElement.classList.add('selected');
  selectedAvatarUrl = imgElement.dataset.avatar;
  avatarPreview.src = selectedAvatarUrl;
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!selectedAvatarUrl) {
    alert('Please select an avatar');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    // Get username from display or from session metadata
    let username = usernameDisplay.textContent;
    if (username === 'loading...' || !username) {
      username = session.user?.user_metadata?.username;
    }
    if (!username) {
      throw new Error('No username available to save');
    }

    const updates = {
      id: session.user.id,
      username: username,
      avatar_url: selectedAvatarUrl,
    //   updated_at: new Date(),
    };

    console.log('Upserting profile:', updates);

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(updates);

    if (upsertError) throw upsertError;

    console.log('Profile saved, redirecting to chat...');
    window.location.href = 'chat.html';
  } catch (error) {
    alert('Error saving profile: ' + error.message);
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Start Bubli-ing';
  }
});