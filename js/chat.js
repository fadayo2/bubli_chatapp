
//   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

//   const SUPABASE_URL = 'https://yhrfzhwjheuavmsiielj.supabase.co';
//   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlocmZ6aHdqaGV1YXZtc2lpZWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MTY1ODksImV4cCI6MjA4NzI5MjU4OX0.0tHWAWqwOTs8Bw4_AtDUEOZGhuM_y0Oukm-t-BzPano';

//   const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//   // ---------- Global state ----------
//   let currentUser = null;
//   let currentProfile = null;
//   let currentChat = null;
//   let privateChats = [];
//   let groupChats = [];
//   let pendingRequests = [];
//   let messages = [];
//   let activeSubscriptions = [];

//   // DOM elements
//   const privateChatsList = document.getElementById('private-chats-list');
//   const groupChatsList = document.getElementById('group-chats-list');
//   const requestsList = document.getElementById('requests-list');
//   const chatHeaderContent = document.getElementById('chat-header-content');
//   const messagesContainer = document.getElementById('messages-container');
//   const messageInput = document.getElementById('message-input');
//   const emojiPicker = document.getElementById('emoji-picker');
//   const emojiGrid = document.getElementById('emoji-grid');
//   const typingIndicator = document.getElementById('typing-indicator');
//   const typingText = document.getElementById('typing-text');
//   const sidebar = document.getElementById('sidebar');
//   const sidebarOverlay = document.getElementById('sidebar-overlay');
//   const profileModal = document.getElementById('profile-modal');
//   const friendUsernameInput = document.getElementById('friend-username');

//   const emojis = ['😀', '😂', '🥰', '😎', '🤔', '😍', '🎉', '👋', '❤️', '🔥', '✨', '👏', '😊', '🤗', '💕', '🙌', '💪', '🥳', '😄', '💖', '🌟', '☺️', '😋', '🤩', '😺', '🤭', '😇', '🙃', '😌', '🥺'];

//   // ---------- Helper ----------
//   function getCurrentTime() {
//     return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
//   }
//   function showMessage(msg, isError = false) {
//     alert(msg);
//   }

//   // ---------- Authentication ----------
//   async function loadCurrentUser() {
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session) {
//         window.location.href = 'signin.html';
//         return;
//       }
//       currentUser = session.user;
//       console.log('Current user:', currentUser);

//       // Get profile
//       const { data: profile, error } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', currentUser.id)
//         .single();

//       if (error) throw error;
//       currentProfile = profile;

//       // Update sidebar user info
//       const avatarEl = document.getElementById('current-user-avatar');
//       const nameEl = document.getElementById('current-user-name');
//       if (avatarEl) {
//         avatarEl.src = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
//       }
//       if (nameEl) {
//         nameEl.textContent = profile.username;
//       }
//     } catch (err) {
//       console.error('Error loading user:', err);
//       showMessage('Failed to load user. Please sign in again.', true);
//       window.location.href = 'signin.html';
//     }
//   }

//   // ---------- Load chats ----------
//   async function loadChats() {
//     if (!currentUser) return;

//     const { data: participations } = await supabase
//       .from('chat_participants')
//       .select('chat_id')
//       .eq('user_id', currentUser.id);

//     if (!participations || participations.length === 0) {
//       privateChats = [];
//       groupChats = [];
//       renderChatLists();
//       return;
//     }

//     const chatIds = participations.map(p => p.chat_id);
//     const { data: chats } = await supabase
//       .from('chats')
//       .select('*')
//       .in('id', chatIds);

//     privateChats = [];
//     groupChats = [];

//     for (const chat of chats) {
//       if (chat.is_group) {
//         const { data: members } = await supabase
//           .from('chat_participants')
//           .select('user_id, profiles(username, avatar_url)')
//           .eq('chat_id', chat.id);
//         chat.members = members.map(m => m.profiles);
//         groupChats.push(chat);
//       } else {
//         const { data: other } = await supabase
//           .from('chat_participants')
//           .select('user_id, profiles(username, avatar_url)')
//           .eq('chat_id', chat.id)
//           .neq('user_id', currentUser.id)
//           .single();
//         chat.otherUser = other?.profiles;
//         privateChats.push(chat);
//       }
//     }
//     renderChatLists();
//   }

//   // ---------- Friend requests ----------
//   async function loadFriendRequests() {
//     if (!currentUser) return;
//     const { data: requests } = await supabase
//       .from('friend_requests')
//       .select('*, sender:profiles!sender_id(username, avatar_url), receiver:profiles!receiver_id(username, avatar_url)')
//       .or(`receiver_id.eq.${currentUser.id},sender_id.eq.${currentUser.id}`)
//       .eq('status', 'pending');

//     pendingRequests = requests || [];
//     renderRequests();
//   }

//   window.sendFriendRequest = async function() {
//     const username = friendUsernameInput?.value.trim();
//     if (!username) return;

//     const { data: targetUser } = await supabase
//       .from('profiles')
//       .select('id')
//       .eq('username', username)
//       .single();

//     if (!targetUser) {
//       showMessage('User not found');
//       return;
//     }
//     if (targetUser.id === currentUser.id) {
//       showMessage('You cannot add yourself');
//       return;
//     }

//     const { data: existing } = await supabase
//       .from('friend_requests')
//       .select('id')
//       .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${currentUser.id})`)
//       .maybeSingle();

//     if (existing) {
//       showMessage('Request already sent or pending');
//       return;
//     }

//     const { error } = await supabase
//       .from('friend_requests')
//       .insert({ sender_id: currentUser.id, receiver_id: targetUser.id });

//     if (error) {
//       showMessage('Error sending request');
//       console.error(error);
//     } else {
//       showMessage('Friend request sent!');
//       friendUsernameInput.value = '';
//     }
//   };

//   window.acceptRequest = async function(requestId, senderId) {
//     await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);

//     const { data: newChat } = await supabase
//       .from('chats')
//       .insert({ is_group: false })
//       .select()
//       .single();

//     await supabase.from('chat_participants').insert([
//       { chat_id: newChat.id, user_id: currentUser.id },
//       { chat_id: newChat.id, user_id: senderId }
//     ]);

//     loadChats();
//     loadFriendRequests();
//   };

//   window.rejectRequest = async function(requestId) {
//     await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
//     loadFriendRequests();
//   };

//   function renderRequests() {
//     if (!requestsList) return;
//     if (pendingRequests.length === 0) {
//       requestsList.innerHTML = '<p class="text-xs text-bubli-dark/40 dark:text-white/40 text-center py-2">No pending requests</p>';
//       return;
//     }

//     requestsList.innerHTML = pendingRequests.map(req => {
//       const isIncoming = req.receiver_id === currentUser.id;
//       const user = isIncoming ? req.sender : req.receiver;
//       return `
//         <div class="flex items-center justify-between p-2 rounded-xl bg-bubli-accent/10">
//           <div class="flex items-center gap-2">
//             <img src="${user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}" class="w-8 h-8 rounded-full">
//             <span class="text-sm font-medium">${user.username}</span>
//           </div>
//           ${isIncoming ? `
//             <div class="flex gap-1">
//               <button onclick="acceptRequest('${req.id}', '${req.sender_id}')" class="p-1 rounded bg-green-500 text-white text-xs hover:bg-green-600">✓</button>
//               <button onclick="rejectRequest('${req.id}')" class="p-1 rounded bg-red-500 text-white text-xs hover:bg-red-600">✗</button>
//             </div>
//           ` : '<span class="text-xs text-bubli-dark/40">Pending</span>'}
//         </div>
//       `;
//     }).join('');
//   }

//   // ---------- Select chat ----------
//   window.selectChat = async function(chatId, isGroup) {
//     activeSubscriptions.forEach(sub => sub.unsubscribe());
//     activeSubscriptions = [];

//     const chat = isGroup ? groupChats.find(c => c.id == chatId) : privateChats.find(c => c.id == chatId);
//     currentChat = chat;

//     const { data: msgs } = await supabase
//       .from('messages')
//       .select('*, sender:profiles!sender_id(username, avatar_url)')
//       .eq('chat_id', chatId)
//       .order('created_at', { ascending: true });

//     messages = msgs || [];
//     renderMessages();

//     const subscription = supabase
//       .channel(`chat:${chatId}`)
//       .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` }, payload => {
//         messages.push(payload.new);
//         renderMessages();
//       })
//       .subscribe();
//     activeSubscriptions.push(subscription);

//     renderChatHeader();
//     if (window.innerWidth < 768) toggleMobileSidebar();
//   };

//   // ---------- Render chat lists ----------
//   function renderChatLists() {
//     privateChatsList.innerHTML = privateChats.map(chat => `
//       <div class="sidebar-item flex items-center gap-3 p-2 rounded-xl cursor-pointer mb-1 ${currentChat?.id === chat.id ? 'active' : ''}" onclick="selectChat('${chat.id}', false)">
//         <div class="relative">
//           <img src="${chat.otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.otherUser?.username}`}" class="w-12 h-12 rounded-full">
//         </div>
//         <div class="flex-1 min-w-0">
//           <div class="flex items-center justify-between">
//             <p class="font-display font-600 text-sm truncate">${chat.otherUser?.username}</p>
//             <span class="text-xs text-bubli-dark/40">last msg</span>
//           </div>
//           <p class="text-xs text-bubli-dark/50 truncate">last message...</p>
//         </div>
//       </div>
//     `).join('');

//     groupChatsList.innerHTML = groupChats.map(chat => `
//       <div class="sidebar-item flex items-center gap-3 p-2 rounded-xl cursor-pointer mb-1 ${currentChat?.id === chat.id ? 'active' : ''}" onclick="selectChat('${chat.id}', true)">
//         <div class="flex -space-x-2">
//           ${chat.members.slice(0, 3).map(m => `<img src="${m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`}" class="w-10 h-10 rounded-full border-2 border-white dark:border-[#231E33]">`).join('')}
//         </div>
//         <div class="flex-1 min-w-0">
//           <div class="flex items-center justify-between">
//             <p class="font-display font-600 text-sm truncate">${chat.name}</p>
//             <span class="text-xs text-bubli-dark/40">last msg</span>
//           </div>
//           <p class="text-xs text-bubli-dark/50 truncate">last message...</p>
//         </div>
//       </div>
//     `).join('');
//   }

//   // ---------- Render chat header ----------
//   function renderChatHeader() {
//     if (!currentChat) return;
//     const isGroup = currentChat.is_group;
//     chatHeaderContent.innerHTML = `
//       <div class="flex items-center gap-3">
//         ${isGroup ? `
//           <div class="flex -space-x-2">
//             ${currentChat.members.slice(0, 3).map(m => `<img src="${m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`}" class="w-9 h-9 rounded-full border-2 border-white dark:border-[#2D2640]">`).join('')}
//           </div>
//         ` : `
//           <div class="relative">
//             <img src="${currentChat.otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentChat.otherUser?.username}`}" class="w-10 h-10 rounded-full">
//           </div>
//         `}
//         <div>
//           <h2 class="font-display font-700">${isGroup ? currentChat.name : currentChat.otherUser?.username}</h2>
//           <p class="text-xs ${isGroup ? '' : 'text-green-500'}">${isGroup ? `${currentChat.members.length} members` : 'Online'}</p>
//         </div>
//       </div>
//     `;
//   }

//   // ---------- Render messages ----------
//   function renderMessages() {
//     messagesContainer.innerHTML = messages.map((msg, index) => {
//       const isOwn = msg.sender_id === currentUser.id;
//       return `
//         <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} animate-message-in">
//           ${!isOwn ? `<button onclick="viewProfile('${msg.sender_id}')" class="flex-shrink-0 mr-2 self-end"><img src="${msg.sender?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.username}`}" class="w-8 h-8 rounded-full"></button>` : ''}
//           <div class="max-w-[75%] sm:max-w-[60%]">
//             ${!isOwn ? `<p class="text-xs font-semibold text-bubli-primary mb-1 ml-1">${msg.sender?.username}</p>` : ''}
//             <div class="message-bubble ${isOwn ? 'message-own' : 'message-other'} px-4 py-2.5">
//               <p class="text-sm ${isOwn ? 'text-white' : ''}">${msg.content}</p>
//             </div>
//             <div class="flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'} px-1">
//               <span class="text-xs text-bubli-dark/40">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
//               ${isOwn ? `<svg class="w-3.5 h-3.5 text-bubli-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>` : ''}
//             </div>
//           </div>
//         </div>
//       `;
//     }).join('');
//     messagesContainer.scrollTop = messagesContainer.scrollHeight;
//   }

//   // ---------- Send message ----------
//   window.sendMessage = async function() {
//     const text = messageInput.value.trim();
//     if (!text || !currentChat) return;

//     const newMsg = {
//       chat_id: currentChat.id,
//       sender_id: currentUser.id,
//       content: text,
//       created_at: new Date().toISOString()
//     };

//     const { error } = await supabase.from('messages').insert(newMsg);
//     if (!error) {
//       messageInput.value = '';
//       messageInput.style.height = 'auto';
//     }
//   };

//   // ---------- Emoji picker ----------
//   window.toggleEmojiPicker = function() {
//     emojiPicker.classList.toggle('hidden');
//   };

//   window.insertEmoji = function(emoji) {
//     messageInput.value += emoji;
//     messageInput.focus();
//     toggleEmojiPicker();
//   };

//   function renderEmojiPicker() {
//     emojiGrid.innerHTML = emojis.map(e => `<button class="emoji-btn w-8 h-8 flex items-center justify-center rounded hover:bg-bubli-accent/20 text-base" onclick="insertEmoji('${e}')">${e}</button>`).join('');
//   }

//   // ---------- Profile view ----------
//   window.viewProfile = async function(userId) {
//     const { data: profile } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', userId)
//       .single();

//     if (!profile) return;

//     document.getElementById('profile-name').textContent = profile.username;
//     document.getElementById('profile-avatar').src = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`;
//     document.getElementById('profile-status-text').textContent = 'Online';
//     document.getElementById('profile-messages').textContent = '0';
//     document.getElementById('profile-chats').textContent = '0';

//     profileModal.classList.remove('hidden');
//     profileModal.classList.add('flex');
//   };

//   window.closeProfile = function() {
//     profileModal.classList.add('hidden');
//     profileModal.classList.remove('flex');
//   };

//   // ---------- Utilities ----------
//   window.toggleMobileSidebar = function() {
//     sidebar.classList.toggle('active');
//     sidebarOverlay.classList.toggle('active');
//   };

//   window.toggleTheme = function() {
//     document.documentElement.classList.toggle('dark');
//   };

//   window.autoResize = function(textarea) {
//     textarea.style.height = 'auto';
//     textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
//   };

//   window.handleKeyDown = function(e) {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   // ---------- Initialization ----------
//   async function init() {
//     await loadCurrentUser();
//     await loadChats();
//     await loadFriendRequests();
//     renderEmojiPicker();

//     const reqSubscription = supabase
//       .channel('friend_requests')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `receiver_id=eq.${currentUser.id}` }, loadFriendRequests)
//       .subscribe();
//     activeSubscriptions.push(reqSubscription);

//     document.addEventListener('click', (e) => {
//       if (!emojiPicker.contains(e.target) && !e.target.closest('[onclick="toggleEmojiPicker()"]')) {
//         emojiPicker.classList.add('hidden');
//       }
//     });

//     profileModal.addEventListener('click', (e) => {
//       if (e.target === profileModal) closeProfile();
//     });

//     document.addEventListener('keydown', (e) => {
//       if (e.key === 'Escape') {
//         closeProfile();
//         emojiPicker.classList.add('hidden');
//       }
//     });
//   }

//   document.addEventListener('DOMContentLoaded', init);