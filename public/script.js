// DOM elements
const chatArea = document.getElementById('chatArea');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');

// State
let isTyping = false;
let messageHistory = [];
const apiEndpoint = '/api/chat';

function init() {
    setupEventListeners();
    focusInput();
    autoResize();
    createParticles();
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
        }, i * 100);
    }
}

function setupEventListeners() {
    sendButton.addEventListener('click', handleSend);
    messageInput.addEventListener('input', handleInput);
    messageInput.addEventListener('keydown', handleKeyDown);
    messageInput.addEventListener('input', autoResize);
}

// This function enables/disables the send button
function handleInput() {
    const value = messageInput.value.trim();
    sendButton.disabled = !value || isTyping;
}

// This function is called when you hit enter or the send button
async function handleSend() {
    const message = messageInput.value.trim();
    if (!message || isTyping) return;

    addMessage(message, 'user');
    messageInput.value = '';
    handleInput();
    autoResize();
    scrollToBottom();

    showTyping();

    try {
        const response = await sendToAPI(message);
        hideTyping();
        await delay(800);
        addMessage(response, 'ai');
    } catch (error) {
        hideTyping();
        addMessage('I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.', 'ai');
        console.error('API Error:', error);
    }
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
}

function autoResize() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

async function sendToAPI(message) {
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                history: getRecentHistory()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.response || 'I understand. Can you tell me more about how you\'re feeling?';
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function addMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const timestamp = getTimestamp();
    const avatar = type === 'ai' ? '🤖' : '👤';
    const messageClass = type === 'ai' ? 'message-ai' : 'message-user';
    const avatarClass = type === 'ai' ? 'avatar-ai' : 'avatar-user';
    
    messageDiv.innerHTML = `
        <div class="${messageClass}">
            <div class="message-avatar ${avatarClass}">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${escapeHtml(content)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        </div>
    `;

    chatArea.insertBefore(messageDiv, typingIndicator);
    
    setTimeout(() => {
        messageDiv.style.animationDelay = '0s';
    }, 50);

    messageHistory.push({ content, type, timestamp });
    scrollToBottom();
}

function showTyping() {
    isTyping = true;
    typingIndicator.classList.add('active');
    sendButton.disabled = true;
    scrollToBottom();
}

function hideTyping() {
    isTyping = false;
    typingIndicator.classList.remove('active');
    handleInput();
}

function scrollToBottom() {
    setTimeout(() => {
        chatArea.scrollTop = chatArea.scrollHeight;
    }, 100);
}

function focusInput() {
    setTimeout(() => messageInput.focus(), 100);
}

function getTimestamp() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getRecentHistory(limit = 5) {
    return messageHistory.slice(-limit);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', init);