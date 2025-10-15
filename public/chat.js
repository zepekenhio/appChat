let socket;
let currentUser = null;
let token = localStorage.getItem('token');

if (token) {
  // If token exists, connect to socket
  socket = io();
  
  // Authenticate immediately after connection
  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('authenticate', token);
  });
  
  // Handle authentication response
  socket.on('authenticated', (data) => {
    console.log('Authenticated successfully:', data.user);
    currentUser = data.user;
    socket.emit('join', { userId: data.user.id, username: data.user.username });
  });
  
  // Handle authentication errors
  socket.on('authentication_error', (data) => {
    console.error('Authentication failed:', data.message);
    localStorage.removeItem('token');
    window.location.href = 'userloggin.html';
  });
} else {
  socket = null;
}

let login = document.getElementById("login")
if (login) {
  login.onclick = async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        // Redirect to chat page
        window.location.href = 'conversation.html';
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  };
}

let register = document.getElementById("register")
if (register) {
  register.onclick = async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        // Redirect to chat page
        window.location.href = 'conversation.html';
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Register error:', error);
      alert('Registration failed');
    }
  };
}




const messages = document.getElementById("messages");

if (socket) {
  // Handle new messages
  socket.on('new_message', (message) => {
    if (currentUser && message.sender._id !== currentUser.id && message.receiver.some(r => r._id === currentUser.id)) {
      displayMessage(message.sender.username, message.content, message.createdAt, 'received');
    }
  });

  // Handle message sent confirmation
  socket.on('message_sent', (data) => {
    console.log('Message sent successfully:', data.messageData);
  });

  // Handle join confirmation
  socket.on('joined', (data) => {
    console.log(data.message);
  });

  // Handle errors
  socket.on('error', (data) => {
    alert('Error: ' + data.message);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
}

let send = document.getElementById("send")
if (send) {
  send.onclick = async () => {
    const text = document.getElementById("msg").value;
    
    if (!text.trim()) {
      alert('Please enter a message');
      return;
    }
    
    if (!currentUser) {
      alert('You must be logged in to send messages');
      return;
    }
    
    const receivers = window.selectedReceivers;
    
    if (!receivers || receivers.length === 0) {
      alert('Please select users to chat with first');
      return;
    }
    
    if (socket) {
      socket.emit('send_message', { receiver: receivers, content: text });
      displayMessage('You', text, new Date(), 'sent');
      document.getElementById("msg").value = '';
    } else {
      alert('Not connected to server');
    }
  };
}

// Handle Enter key press in message input
document.addEventListener('DOMContentLoaded', () => {
  const msgInput = document.getElementById("msg");
  if (msgInput) {
    msgInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const sendBtn = document.getElementById("send");
        if (sendBtn) {
          sendBtn.click();
        }
      }
    });
  }
});

// Load users for selection (optional feature)
async function loadUsers() {
  try {
    const response = await fetch('/api/users/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const userSelect = document.getElementById('userSelect');
      if (userSelect) {
        userSelect.innerHTML = '';
        data.forEach(user => {
          if (currentUser && user._id !== currentUser.id) {
            const option = document.createElement('option');
            option.value = user._id;
            option.textContent = user.username;
            userSelect.appendChild(option);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Load conversation history
async function loadConversation(userId1, userIds) {
  try {
    const userIdsStr = Array.isArray(userIds) ? userIds.join(',') : userIds;
    const response = await fetch(`/api/messages/conversation/${userId1}/${userIdsStr}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const messages = document.getElementById("messages");
      if (messages) {
        messages.innerHTML = ''; // Clear existing messages
        data.data.forEach(message => {
          const isOwnMessage = currentUser && message.sender._id === currentUser.id;
          displayMessage(
            message.sender.username, 
            message.content, 
            message.createdAt, 
            isOwnMessage ? 'sent' : 'received'
          );
        });
      }
    }
  } catch (error) {
    console.error('Error loading conversation:', error);
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load users when page loads
  if (token) {
    setTimeout(() => {
      loadUsers();
    }, 1000); // Wait for authentication to complete
  }
  
  // Handle user selection
  const loadChatBtn = document.getElementById('loadChat');
  if (loadChatBtn) {
    loadChatBtn.onclick = () => {
      const userSelect = document.getElementById('userSelect');
      const selectedOptions = Array.from(userSelect.selectedOptions);
      const selectedUserIds = selectedOptions.map(option => option.value);
      const selectedUserNames = selectedOptions.map(option => option.text);
      
      if (selectedUserIds.length > 0 && currentUser) {
        document.getElementById('chatWith').textContent = `Chat with ${selectedUserNames.join(', ')}`;
        loadConversation(currentUser.id, selectedUserIds);
        
        // Store selected users for sending messages
        window.selectedReceivers = selectedUserIds;
      } else {
        alert('Please select at least one user to chat with');
      }
    };
  }
});

let logout = document.getElementById("logout")
if (logout) {
  logout.onclick = () => {
    localStorage.removeItem('token');
    window.location.href = 'userloggin.html';
  };
}

function displayMessage(sender, content, timestamp, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.innerHTML = `
    <strong>${sender}:</strong> ${content}
    <small>${new Date(timestamp).toLocaleTimeString()}</small>
  `;
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight;
}

  

