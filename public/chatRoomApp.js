let socket;
let currentUser = null;
let currentChatRoom = null;
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
        // Load chat rooms after authentication
        loadChatRooms();
        loadUsers(); // Load users for creating rooms
    });
    
    // Handle authentication errors
    socket.on('authentication_error', (data) => {
        console.error('Authentication failed:', data.message);
        localStorage.removeItem('token');
        window.location.href = 'userloggin.html';
    });
    
    // Handle room joined
    socket.on('room_joined', (data) => {
        console.log('Joined room:', data.chatRoomId);
        currentChatRoom = data.chatRoom;
        loadChatMessages(data.chatRoomId);
    });
    
    // Handle new messages
    socket.on('new_message', (message) => {
        if (currentChatRoom && message.chatRoom === currentChatRoom._id) {
            const isOwnMessage = currentUser && message.sender._id === currentUser.id;
            displayMessage(
                message.sender.username, 
                message.content, 
                message.createdAt, 
                isOwnMessage ? 'sent' : 'received'
            );
        }
    });
    
    // Handle message sent confirmation
    socket.on('message_sent', (data) => {
        console.log('Message sent successfully:', data.messageData);
    });
    
    // Handle errors
    socket.on('error', (data) => {
        alert('Error: ' + data.message);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
} else {
    // Redirect to login if no token
    window.location.href = 'userloggin.html';
}

// Load all chat rooms for the current user
async function loadChatRooms() {
    try {
        const response = await fetch('/api/chatrooms/my-rooms', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayChatRooms(data.data);
        } else {
            console.error('Failed to load chat rooms');
        }
    } catch (error) {
        console.error('Error loading chat rooms:', error);
    }
}

// Display chat rooms in the sidebar
function displayChatRooms(chatRooms) {
    const chatRoomsList = document.getElementById('chatRoomsList');
    if (!chatRoomsList) return;
    
    chatRoomsList.innerHTML = '';
    
    if (chatRooms.length === 0) {
        chatRoomsList.innerHTML = '<p class="no-rooms">No chat rooms yet. Create one!</p>';
        return;
    }
    
    chatRooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = 'room-item';
        
        // Get participant names (excluding current user)
        const otherParticipants = room.participants
            .filter(p => p.userId !== currentUser.id)
            .map(p => p.username);
        
        const roomName = otherParticipants.length > 0 
            ? otherParticipants.join(', ') 
            : 'You (Private Room)';
        
        roomDiv.innerHTML = `
            <div class="room-info">
                <strong>${roomName}</strong>
                <small>${room.participants.length} participant(s)</small>
            </div>
        `;
        
        roomDiv.onclick = () => selectChatRoom(room);
        chatRoomsList.appendChild(roomDiv);
    });
}

// Select a chat room
function selectChatRoom(room) {
    currentChatRoom = room;
    
    // Update UI
    document.getElementById('noChatSelected').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'block';
    
    // Get participant names
    const participantNames = room.participants.map(p => p.username).join(', ');
    document.getElementById('chatRoomName').textContent = participantNames;
    
    // Clear messages
    document.getElementById('messages').innerHTML = '';
    
    // Join the room via socket
    if (socket) {
        socket.emit('join_room', { chatRoomId: room._id });
    }
}

// Load chat messages for a room
async function loadChatMessages(chatRoomId) {
    try {
        const response = await fetch(`/api/messages/chatroom/${chatRoomId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = '';
            
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
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display a message
function displayMessage(sender, content, timestamp, type) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <strong>${sender}:</strong> ${content}
        <small>${new Date(timestamp).toLocaleTimeString()}</small>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send');
    if (sendBtn) {
        sendBtn.onclick = () => {
            const msgInput = document.getElementById('msg');
            const text = msgInput.value.trim();
            
            if (!text) {
                alert('Please enter a message');
                return;
            }
            
            if (!currentChatRoom) {
                alert('Please select a chat room first');
                return;
            }
            
            if (socket) {
                socket.emit('send_message', { 
                    chatRoomId: currentChatRoom._id, 
                    content: text 
                });
                msgInput.value = '';
            } else {
                alert('Not connected to server');
            }
        };
    }
    
    // Handle Enter key
    const msgInput = document.getElementById('msg');
    if (msgInput) {
        msgInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendBtn.click();
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('token');
            window.location.href = 'userloggin.html';
        };
    }
    
    // Create room modal
    const createRoomBtn = document.getElementById('createRoomBtn');
    const createRoomModal = document.getElementById('createRoomModal');
    const createRoomConfirm = document.getElementById('createRoomConfirm');
    
    if (createRoomBtn && createRoomModal) {
        createRoomBtn.onclick = () => {
            createRoomModal.style.display = 'block';
            loadUsers(); // Refresh users list
        };
    }
    
    if (createRoomConfirm) {
        createRoomConfirm.onclick = createNewChatRoom;
    }
    
    // Add participant modal
    const addParticipantBtn = document.getElementById('addParticipantBtn');
    const addParticipantModal = document.getElementById('addParticipantModal');
    const addParticipantConfirm = document.getElementById('addParticipantConfirm');
    
    if (addParticipantBtn && addParticipantModal) {
        addParticipantBtn.onclick = () => {
            if (!currentChatRoom) {
                alert('Please select a chat room first');
                return;
            }
            addParticipantModal.style.display = 'block';
            loadUsersForAdding();
        };
    }
    
    if (addParticipantConfirm) {
        addParticipantConfirm.onclick = addParticipantToChatRoom;
    }
    
    // View participants button
    const viewParticipantsBtn = document.getElementById('viewParticipantsBtn');
    const viewParticipantsModal = document.getElementById('viewParticipantsModal');
    
    if (viewParticipantsBtn && viewParticipantsModal) {
        viewParticipantsBtn.onclick = () => {
            if (!currentChatRoom) {
                alert('Please select a chat room first');
                return;
            }
            displayParticipants();
            viewParticipantsModal.style.display = 'block';
        };
    }
    
    // Close modals
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(btn => {
        btn.onclick = function() {
            this.parentElement.parentElement.style.display = 'none';
        };
    });
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
});

// Load all users for creating rooms
async function loadUsers() {
    try {
        const response = await fetch('/api/users/all', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            const participantSelect = document.getElementById('participantSelect');
            if (participantSelect) {
                participantSelect.innerHTML = '';
                users.forEach(user => {
                    if (currentUser && user._id !== currentUser.id) {
                        const option = document.createElement('option');
                        option.value = user._id;
                        option.textContent = user.username;
                        participantSelect.appendChild(option);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load users for adding to existing room
async function loadUsersForAdding() {
    try {
        const response = await fetch('/api/users/all', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            const newParticipantSelect = document.getElementById('newParticipantSelect');
            if (newParticipantSelect && currentChatRoom) {
                newParticipantSelect.innerHTML = '';
                
                // Get current participant IDs
                const currentParticipantIds = currentChatRoom.participants.map(p => p.userId.toString());
                
                users.forEach(user => {
                    if (!currentParticipantIds.includes(user._id)) {
                        const option = document.createElement('option');
                        option.value = user._id;
                        option.textContent = user.username;
                        newParticipantSelect.appendChild(option);
                    }
                });
                
                if (newParticipantSelect.options.length === 0) {
                    newParticipantSelect.innerHTML = '<option disabled>No users to add</option>';
                }
            }
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Create new chat room
async function createNewChatRoom() {
    const participantSelect = document.getElementById('participantSelect');
    const selectedOptions = Array.from(participantSelect.selectedOptions);
    const participantIds = selectedOptions.map(option => option.value);
    
    if (participantIds.length === 0) {
        alert('Please select at least one participant');
        return;
    }
    
    try {
        const response = await fetch('/api/chatrooms/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ participantIds })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Chat room created successfully!');
            document.getElementById('createRoomModal').style.display = 'none';
            loadChatRooms(); // Refresh the list
        } else {
            alert(data.error || 'Failed to create chat room');
        }
    } catch (error) {
        console.error('Error creating chat room:', error);
        alert('Failed to create chat room');
    }
}

// Add participant to chat room
async function addParticipantToChatRoom() {
    const newParticipantSelect = document.getElementById('newParticipantSelect');
    const participantId = newParticipantSelect.value;
    
    if (!participantId) {
        alert('Please select a user');
        return;
    }
    
    try {
        const response = await fetch(`/api/chatrooms/${currentChatRoom._id}/add-participant`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ participantId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Participant added successfully!');
            document.getElementById('addParticipantModal').style.display = 'none';
            currentChatRoom = data.data; // Update current room
            loadChatRooms(); // Refresh the list
        } else {
            alert(data.error || 'Failed to add participant');
        }
    } catch (error) {
        console.error('Error adding participant:', error);
        alert('Failed to add participant');
    }
}

// Display participants
function displayParticipants() {
    const participantsList = document.getElementById('participantsList');
    if (!participantsList || !currentChatRoom) return;
    
    participantsList.innerHTML = '';
    
    currentChatRoom.participants.forEach(participant => {
        const participantDiv = document.createElement('div');
        participantDiv.className = 'participant-item';
        participantDiv.innerHTML = `
            <strong>${participant.username}</strong>
            ${participant.userId === currentUser.id ? '<span class="badge">You</span>' : ''}
        `;
        participantsList.appendChild(participantDiv);
    });
}
