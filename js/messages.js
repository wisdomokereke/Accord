/* 
   ACCORD — MESSAGES
    */

/* 
   GLOBAL STATE
    */

let currentUser = null;
let currentProfile = null;

let conversations = [];
let currentConversation = null;
let currentConversationPartner = null;

let messageSubscription = null;
let conversationSubscription = null;

let searchTimeout = null;
let toastTimeout = null;

/* 
   DOM ELEMENTS
    */

const dealRooms = document.getElementById("deal-rooms");

const conversationList = document.getElementById("conversation-list");
const conversationEmpty = document.getElementById("conversation-empty");
const localSearch = document.getElementById("local-search");

const chatEmpty = document.getElementById("chat-empty");
const activeChat = document.getElementById("active-chat");

const chatAvatar = document.getElementById("chat-avatar");
const chatUsername = document.getElementById("chat-username");
const chatStatus = document.getElementById("chat-status");
const onlineIndicator = document.getElementById("online-indicator");

const messagesContainer = document.getElementById("messages-container");
const messagesList = document.getElementById("messages-list");

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const sendMessageButton = document.getElementById("send-message");

const newConversationButton = document.getElementById("new-conversation-btn");

const emptyFindUserButton = document.getElementById("empty-find-user-btn");

/* Global search */

const globalSearchModal = document.getElementById("global-search-modal");

const globalSearchClose = document.getElementById("global-search-close");

const globalUsernameInput = document.getElementById("global-username-input");

const globalSearchResults = document.getElementById("global-search-results");

const searchResultsEmpty = document.getElementById("search-results-empty");

/* Settings */

const settingsModal = document.getElementById("settings-modal");

const settingsClose = document.getElementById("settings-close");

const navSettings = document.getElementById("nav-settings");

const navMessages = document.getElementById("nav-messages");

/* Logout */

const logoutButton = document.getElementById("logout-btn");

const logoutModal = document.getElementById("logout-modal");

const logoutCancel = document.getElementById("logout-cancel");

const logoutConfirm = document.getElementById("logout-confirm");

/* Settings values */

const settingsAvatar = document.getElementById("settings-avatar");

const settingsUsername = document.getElementById("settings-username");

const settingsEmail = document.getElementById("settings-email");

const settingsUsernameValue = document.getElementById(
  "settings-username-value",
);

const settingsPreference = document.getElementById("settings-preference");

const settingsLocation = document.getElementById("settings-location");

/* Notification */

const notification = document.getElementById("notification");

const notificationMessage = document.getElementById("notification-message");

/* 
   INITIALIZATION
    */

document.addEventListener("DOMContentLoaded", initializeMessages);

async function initializeMessages() {
  try {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    /*
      User is not authenticated.
      Send them to login.
    */
    if (!session || !session.user) {
      window.location.href = "html/auth/login.html";
      return;
    }

    currentUser = session.user;

    await loadCurrentProfile();

    setupEventListeners();

    await loadConversations();

    setupRealtime();
  } catch (error) {
    console.error("Messages initialization error:", error);

    showNotification("Something went wrong while loading Accord.");
  }
}

/* 
   PROFILE
    */

async function loadCurrentProfile() {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.error("Profile error:", error);

    /*
      If a user has Auth but somehow has no profile,
      send them back to signup rather than leaving
      the app in a broken state.
    */
    if (error.code === "PGRST116") {
      showNotification("Your Accord profile could not be found.");

      setTimeout(() => {
        window.location.href = "html/auth/signup.html";
      }, 1500);
    }

    throw error;
  }

  currentProfile = data;

  populateSettings();
}

/* 
   SETTINGS
    */

function populateSettings() {
  if (!currentProfile) return;

  const username = currentProfile.username || "username";

  const initial = username.charAt(0).toUpperCase();

  settingsAvatar.textContent = initial;

  settingsUsername.textContent = `@${username}`;

  settingsUsernameValue.textContent = `@${username}`;

  settingsEmail.textContent = currentUser.email || "Account";

  settingsPreference.textContent = formatPreference(currentProfile.preference);

  settingsLocation.textContent = currentProfile.location || "Not provided";
}

function formatPreference(preference) {
  if (!preference) {
    return "Not selected";
  }

  const labels = {
    ai: "AI",
    business: "Business",
    personal: "Personal",
    school: "School work",
  };

  return labels[preference] || preference;
}

/* 
   EVENT LISTENERS
    */

function setupEventListeners() {
  /* Existing conversation search */
  localSearch.addEventListener("input", handleLocalSearch);

  /* New conversation */
  newConversationButton.addEventListener("click", openGlobalSearch);

  emptyFindUserButton.addEventListener("click", openGlobalSearch);

  /* Global search */
  globalSearchClose.addEventListener("click", closeGlobalSearch);

  globalUsernameInput.addEventListener("input", handleGlobalUsernameSearch);

  /* Settings */
  navSettings.addEventListener("click", openSettings);

  settingsClose.addEventListener("click", closeSettings);

  navMessages.addEventListener("click", () => {
    closeSettings();
    setActiveNav("messages");
  });

  /* Logout */
  logoutButton.addEventListener("click", openLogoutModal);

  logoutCancel.addEventListener("click", closeLogoutModal);

  logoutConfirm.addEventListener("click", logout);

  /* Send message */
  messageForm.addEventListener("submit", handleSendMessage);

  /* Enter to send */
  messageInput.addEventListener("keydown", handleMessageKeydown);

  /* Close modals when clicking backdrop */
  globalSearchModal.addEventListener("click", (event) => {
    if (event.target === globalSearchModal) {
      closeGlobalSearch();
    }
  });

  settingsModal.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      closeSettings();
    }
  });

  logoutModal.addEventListener("click", (event) => {
    if (event.target === logoutModal) {
      closeLogoutModal();
    }
  });

  /* Escape closes open modal */
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    closeGlobalSearch();
    closeSettings();
    closeLogoutModal();
  });
}

/* 
   LOAD CONVERSATIONS
    */

async function loadConversations() {
  conversationList.innerHTML = "";

  conversationList.appendChild(
    createLoadingElement("Loading conversations..."),
  );

  const { data: memberships, error: membershipError } = await supabaseClient
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", currentUser.id);

  if (membershipError) {
    console.error("Conversation membership error:", membershipError);

    renderConversationEmpty("Unable to load your conversations.");

    return;
  }

  if (!memberships || memberships.length === 0) {
    conversations = [];

    renderConversationEmpty();

    return;
  }

  const conversationIds = memberships.map((item) => item.conversation_id);

  const { data: members, error: membersError } = await supabaseClient
    .from("conversation_members")
    .select(
      `
      conversation_id,
      user_id,
      profiles (
        id,
        username,
        display_name,
        avatar_url
      )
    `,
    )
    .in("conversation_id", conversationIds);

  if (membersError) {
    console.error("Conversation members error:", membersError);

    renderConversationEmpty("Unable to load your conversations.");

    return;
  }

  /*
    Build a conversation object containing
    the other person in each conversation.
  */

  conversations = [];

  for (const conversationId of conversationIds) {
    const conversationMembers = (members || []).filter(
      (member) => member.conversation_id === conversationId,
    );

    const otherMember = conversationMembers.find(
      (member) => member.user_id !== currentUser.id,
    );

    if (!otherMember || !otherMember.profiles) {
      continue;
    }

    conversations.push({
      id: conversationId,
      partner: otherMember.profiles,
      lastMessage: null,
      lastMessageTime: null,
    });
  }

  /*
    Get latest message for each conversation.
  */

  for (const conversation of conversations) {
    const { data: latestMessages } = await supabaseClient
      .from("messages")
      .select(
        `
        content,
        created_at
      `,
      )
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestMessages && latestMessages.length > 0) {
      conversation.lastMessage = latestMessages[0].content;

      conversation.lastMessageTime = latestMessages[0].created_at;
    }
  }

  conversations.sort((a, b) => {
    const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;

    const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;

    return bTime - aTime;
  });

  renderConversations(conversations);
}

/* 
   RENDER CONVERSATIONS
    */

function renderConversations(list) {
  conversationList.innerHTML = "";

  if (!list || list.length === 0) {
    renderConversationEmpty();
    return;
  }

  conversationEmpty.classList.add("hidden");

  list.forEach((conversation) => {
    const button = document.createElement("button");

    button.type = "button";

    button.className = "conversation-item";

    button.dataset.conversationId = conversation.id;

    if (currentConversation && currentConversation.id === conversation.id) {
      button.classList.add("active");
    }

    const avatar = document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent = getInitial(conversation.partner.username);

    const info = document.createElement("div");

    info.className = "conversation-info";

    const top = document.createElement("div");

    top.className = "conversation-top";

    const username = document.createElement("strong");

    username.textContent = `@${conversation.partner.username}`;

    const time = document.createElement("span");

    time.textContent = formatConversationTime(conversation.lastMessageTime);

    top.appendChild(username);
    top.appendChild(time);

    const preview = document.createElement("p");

    preview.textContent = conversation.lastMessage || "Start a conversation";

    info.appendChild(top);
    info.appendChild(preview);

    button.appendChild(avatar);
    button.appendChild(info);

    button.addEventListener("click", () => {
      openConversation(conversation);
    });

    conversationList.appendChild(button);
  });
}

/* 
   EMPTY CONVERSATIONS
    */

function renderConversationEmpty(customMessage = null) {
  conversationList.innerHTML = "";

  conversationEmpty.classList.remove("hidden");

  const paragraph = conversationEmpty.querySelector("p");

  if (paragraph) {
    paragraph.textContent =
      customMessage ||
      "Find someone by their username to start a conversation.";
  }

  conversationList.appendChild(conversationEmpty);
}

/* 
   LOCAL SEARCH
    */

function handleLocalSearch(event) {
  const query = event.target.value.trim().toLowerCase();

  if (!query) {
    renderConversations(conversations);
    return;
  }

  const filtered = conversations.filter((conversation) => {
    const username = conversation.partner.username?.toLowerCase() || "";

    const displayName = conversation.partner.display_name?.toLowerCase() || "";

    return username.includes(query) || displayName.includes(query);
  });

  if (filtered.length === 0) {
    conversationList.innerHTML = "";

    const empty = document.createElement("div");

    empty.className = "conversation-empty";

    empty.innerHTML = `
      <div class="empty-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      <h2>No matches</h2>

      <p>
        No existing Deal Room matches your search.
      </p>
    `;

    conversationList.appendChild(empty);

    return;
  }

  renderConversations(filtered);
}

/* 
   OPEN CONVERSATION
    */

async function openConversation(conversation) {
  currentConversation = conversation;

  currentConversationPartner = conversation.partner;

  /*
    Highlight selected conversation.
  */

  document.querySelectorAll(".conversation-item").forEach((item) => {
    item.classList.toggle(
      "active",
      item.dataset.conversationId === conversation.id,
    );
  });

  /*
    Populate header.
  */

  const username = conversation.partner.username;

  chatAvatar.textContent = getInitial(username);

  chatUsername.textContent = `@${username}`;

  /*
    We currently don't have a reliable
    presence table, so the default is Offline.
    We will add real online presence later.
  */

  setOnlineStatus(false);

  /*
    Show chat.
  */

  chatEmpty.classList.add("hidden");

  activeChat.classList.remove("hidden");

  /*
    Enable composer.
  */

  messageInput.disabled = false;
  sendMessageButton.disabled = false;

  messageInput.placeholder = `Message @${username}...`;

  /*
    Load messages.
  */

  await loadMessages(conversation.id);

  /*
    Subscribe to this conversation.
  */

  subscribeToMessages(conversation.id);

  /*
    Focus composer.
  */

  messageInput.focus();
}

/* 
   LOAD MESSAGES
    */

async function loadMessages(conversationId) {
  messagesList.innerHTML = "";

  messagesList.appendChild(createLoadingElement("Loading messages..."));

  const { data, error } = await supabaseClient
    .from("messages")
    .select(
      `
      id,
      conversation_id,
      sender_id,
      content,
      created_at
    `,
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Message loading error:", error);

    messagesList.innerHTML = "";

    const errorMessage = document.createElement("div");

    errorMessage.className = "messages-start";

    errorMessage.textContent = "Unable to load messages.";

    messagesList.appendChild(errorMessage);

    return;
  }

  renderMessages(data || []);

  scrollMessagesToBottom();
}

/* 
   RENDER MESSAGES
    */

function renderMessages(messages) {
  messagesList.innerHTML = "";

  if (!messages || messages.length === 0) {
    const empty = document.createElement("div");

    empty.className = "messages-start";

    empty.textContent = "This is the beginning of your conversation.";

    messagesList.appendChild(empty);

    return;
  }

  messages.forEach((message) => {
    appendMessage(message, false);
  });
}

/* 
   APPEND MESSAGE
    */

function appendMessage(message, scroll = true) {
  // Remove the empty-state message if it exists
  const empty = messagesList.querySelector(".messages-start");

  if (empty) {
    empty.remove();
  }

  // Prevent the same message from being rendered twice
  if (
    message.id &&
    messagesList.querySelector(`[data-message-id="${message.id}"]`)
  ) {
    return;
  }

  // Determine whether this message belongs to the current user
  const outgoing = message.sender_id === currentUser.id;

  // Message row
  const row = document.createElement("div");

  row.className = `message-row ${outgoing ? "outgoing" : "incoming"}`;

  row.dataset.messageId = message.id;

  // Message bubble
  const bubble = document.createElement("div");

  bubble.className = "message-bubble";

  // Message text
  const text = document.createElement("p");

  text.textContent = message.content;

  // Message time
  const time = document.createElement("span");

  time.className = "message-time";

  if (message.created_at) {
    const date = new Date(message.created_at);

    time.textContent = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // Build the message
  bubble.appendChild(text);
  bubble.appendChild(time);

  row.appendChild(bubble);

  // Add message to conversation
  messagesList.appendChild(row);

  // Scroll to newest message
  if (scroll) {
    messagesList.parentElement.scrollTop =
      messagesList.parentElement.scrollHeight;
  }
}

/* 
   SEND MESSAGE
    */

async function handleSendMessage(event) {
  event.preventDefault();

  if (!currentUser || !currentConversation) {
    return;
  }

  const content = messageInput.value.trim();

  if (!content) {
    return;
  }

  /*
    Temporarily disable sending so the
    user cannot accidentally duplicate
    messages with rapid clicks.
  */

  messageInput.disabled = true;
  sendMessageButton.disabled = true;

  const { data, error } = await supabaseClient
    .from("messages")
    .insert({
      conversation_id: currentConversation.id,

      sender_id: currentUser.id,

      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Send message error:", error);

    showNotification("Message could not be sent.");

    messageInput.disabled = false;
    sendMessageButton.disabled = false;

    return;
  }

  /*
    Realtime normally delivers this message
    to the UI. We append it here as well only
    if there is no active subscription.
  */

  if (!messageSubscription) {
    appendMessage(data);
  }

  messageInput.value = "";

  messageInput.disabled = false;
  sendMessageButton.disabled = false;

  messageInput.focus();

  /*
    Refresh the conversation preview.
  */

  await loadConversations();
}

/* 
   MESSAGE KEYBOARD
    */

function handleMessageKeydown(event) {
  /*
    Enter sends the message.
    Shift + Enter creates a new line.
  */

  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    messageForm.requestSubmit();
  }
}

/* 
   REALTIME
    */

function setupRealtime() {
  /*
    Watch conversation_members.

    If another conversation is created or
    membership changes, reload Deal Rooms.
  */

  conversationSubscription = supabaseClient
    .channel(`conversation-members-${currentUser.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversation_members",
        filter: `user_id=eq.${currentUser.id}`,
      },
      async () => {
        await loadConversations();
      },
    )
    .subscribe();
}

function subscribeToMessages(conversationId) {
  /*
    Remove previous subscription.
  */

  if (messageSubscription) {
    supabaseClient.removeChannel(messageSubscription);

    messageSubscription = null;
  }

  messageSubscription = supabaseClient
    .channel(`messages-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        /*
            Avoid displaying a message twice
            if it was already rendered by another
            mechanism.
          */

        const existing = messagesList.querySelector(
          `[data-message-id="${payload.new.id}"]`,
        );

        if (existing) {
          return;
        }

        appendMessage(payload.new, true);
      },
    )
    .subscribe();
}

/* 
   GLOBAL USERNAME SEARCH
    */

function openGlobalSearch() {
  globalSearchModal.classList.remove("hidden");

  globalSearchModal.setAttribute("aria-hidden", "false");

  globalUsernameInput.value = "";

  resetGlobalSearch();

  setTimeout(() => {
    globalUsernameInput.focus();
  }, 50);
}

function closeGlobalSearch() {
  globalSearchModal.classList.add("hidden");

  globalSearchModal.setAttribute("aria-hidden", "true");
}

function resetGlobalSearch() {
  globalSearchResults
    .querySelectorAll(".user-result")
    .forEach((result) => result.remove());

  searchResultsEmpty.classList.remove("hidden");

  searchResultsEmpty.querySelector("p").textContent =
    "Search for a username to find someone.";
}

/* 
   GLOBAL USERNAME SEARCH
    */

function handleGlobalUsernameSearch(event) {
  const query = event.target.value.trim().toLowerCase();

  clearTimeout(searchTimeout);

  if (!query) {
    resetGlobalSearch();
    return;
  }

  searchTimeout = setTimeout(() => searchUsers(query), 300);
}

async function searchUsers(query) {
  searchResultsEmpty.classList.add("hidden");

  globalSearchResults
    .querySelectorAll(".user-result")
    .forEach((result) => result.remove());

  const { data, error } = await supabaseClient
    .from("profiles")
    .select(
      `
      id,
      username,
      display_name,
      avatar_url
    `,
    )
    .ilike("username", `%${query}%`)
    .neq("id", currentUser.id)
    .limit(10);

  if (error) {
    console.error("Username search error:", error);

    showSearchEmpty("Unable to search for users.");

    return;
  }

  if (!data || data.length === 0) {
    showSearchEmpty("No users found.");

    return;
  }

  data.forEach((profile) => {
    const result = document.createElement("button");

    result.type = "button";

    result.className = "user-result";

    const avatar = document.createElement("div");

    avatar.className = "avatar";

    avatar.textContent = getInitial(profile.username);

    const info = document.createElement("div");

    info.className = "user-result-info";

    const username = document.createElement("strong");

    username.textContent = `@${profile.username}`;

    info.appendChild(username);

    if (profile.display_name) {
      const displayName = document.createElement("span");

      displayName.textContent = profile.display_name;

      info.appendChild(displayName);
    }

    result.appendChild(avatar);
    result.appendChild(info);

    result.addEventListener("click", () => {
      startConversationWith(profile);
    });

    globalSearchResults.appendChild(result);
  });
}

function showSearchEmpty(message) {
  searchResultsEmpty.classList.remove("hidden");

  const paragraph = searchResultsEmpty.querySelector("p");

  if (paragraph) {
    paragraph.textContent = message;
  }
}

/* 
   START CONVERSATION
    */

async function startConversationWith(profile) {
  /*
    First check whether a Deal Room already
    exists with this person.
  */

  const existing = conversations.find(
    (conversation) => conversation.partner.id === profile.id,
  );

  if (existing) {
    closeGlobalSearch();
    await openConversation(existing);
    return;
  }

  /*
    Ask the database to create the Deal Room.

    The PostgreSQL function:
    - checks that we are logged in
    - prevents conversations with yourself
    - checks that the other user exists
    - checks for an existing Deal Room
    - creates the conversation if needed
    - adds both users as members
  */

  const { data: conversationId, error } = await supabaseClient.rpc(
    "create_deal_room",
    {
      other_user_id: profile.id,
    },
  );

  if (error) {
    console.error("Conversation creation error:", error);

    showNotification(error.message || "Could not create the conversation.");

    return;
  }

  if (!conversationId) {
    console.error("No conversation ID returned from create_deal_room.");

    showNotification("Could not create the conversation.");

    return;
  }

  /*
    The Deal Room has now been created
    by the database function.
  */

  closeGlobalSearch();

  /*
    Reload the user's conversations so the
    new Deal Room appears in the inbox.
  */

  await loadConversations();

  /*
    Find the newly-created Deal Room.
  */

  const createdConversation = conversations.find(
    (conversation) => conversation.id === conversationId,
  );

  if (createdConversation) {
    await openConversation(createdConversation);
    return;
  }

  /*
    If realtime/loading takes a moment,
    give the list a short second attempt.
  */

  showNotification("Deal Room created. Refreshing conversations...");

  setTimeout(async () => {
    await loadConversations();

    const refreshedConversation = conversations.find(
      (conversation) => conversation.id === conversationId,
    );

    if (refreshedConversation) {
      await openConversation(refreshedConversation);
    }
  }, 500);
}

/* 
   SETTINGS
    */

function openSettings() {
  setActiveNav("settings");

  settingsModal.classList.remove("hidden");

  settingsModal.setAttribute("aria-hidden", "false");
}

function closeSettings() {
  settingsModal.classList.add("hidden");

  settingsModal.setAttribute("aria-hidden", "true");
}

function setActiveNav(active) {
  navMessages.classList.toggle("active", active === "messages");

  navSettings.classList.toggle("active", active === "settings");
}

/* 
   LOGOUT
    */

function openLogoutModal() {
  logoutModal.classList.remove("hidden");

  logoutModal.setAttribute("aria-hidden", "false");
}

function closeLogoutModal() {
  logoutModal.classList.add("hidden");

  logoutModal.setAttribute("aria-hidden", "true");
}

async function logout() {
  logoutConfirm.disabled = true;

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    console.error("Logout error:", error);

    logoutConfirm.disabled = false;

    showNotification("Could not log you out.");

    return;
  }

  /*
    Go back to login.
  */

  window.location.href = "html/auth/login.html";
}

/* 
   ONLINE STATUS
    */

function setOnlineStatus(online) {
  onlineIndicator.classList.toggle("online", online);

  chatStatus.textContent = online ? "Online" : "Offline";
}

/* 
   HELPERS
    */

function getInitial(username) {
  if (!username) {
    return "?";
  }

  return username.charAt(0).toUpperCase();
}

function formatMessageTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatConversationTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);

  const now = new Date();

  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function createLoadingElement(text) {
  const element = document.createElement("div");

  element.className = "loading";

  element.textContent = text;

  return element;
}

function scrollMessagesToBottom() {
  requestAnimationFrame(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
}

/* 
   NOTIFICATIONS
    */

function showNotification(message) {
  if (!notification) {
    return;
  }

  notificationMessage.textContent = message;

  notification.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    notification.classList.remove("show");
  }, 3500);
}

/* 
   AUTH STATE LISTENER
    */

supabaseClient.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    window.location.href = "html/auth/login.html";

    return;
  }

  if (event === "TOKEN_REFRESHED" && session) {
    currentUser = session.user;
  }
});
