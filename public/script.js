class NextGenTherapyAI {
    constructor() {
        this.chatArea = document.getElementById('chatArea');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        this.isTyping = false;
        this.messageHistory = [];
        
        this.apiEndpoint = '/api/chat';
        
        this.init();
        this.createParticles();
    }

    init() {
        this.setupEventListeners();
        this.focusInput();
        this.autoResize();
    }

    createParticles() {
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

    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.messageInput.addEventListener('input', () => this.handleInput());
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => this.autoResize());
    }

    handleInput() {
        const value = this.messageInput.value.trim();
        this.sendButton.disabled = !value || this.isTyping;
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSend();
        }
    }

    autoResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async handleSend() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.handleInput();
        this.autoResize();
        this.scrollToBottom();

        this.showTyping();

        try {
            const response = await this.sendToAPI(message);
            this.hideTyping();
            await this.delay(800);
            this.addMessage(response, 'ai');
        } catch (error) {
            this.hideTyping();
            this.addMessage('I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.', 'ai');
            console.error('API Error:', error);
        }
    }

    async sendToAPI(message) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: this.getRecentHistory()
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

    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const timestamp = this.getTimestamp();
        const avatar = type === 'ai' ? '🤖' : '👤';
        const messageClass = type === 'ai' ? 'message-ai' : 'message-user';
        const avatarClass = type === 'ai' ? 'avatar-ai' : 'avatar-user';
        
        messageDiv.innerHTML = `
            <div class="${messageClass}">
                <div class="message-avatar ${avatarClass}">${avatar}</div>
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;

        this.chatArea.insertBefore(messageDiv, this.typingIndicator);
        
        setTimeout(() => {
            messageDiv.style.animationDelay = '0s';
        }, 50);

        this.messageHistory.push({ content, type, timestamp });
        this.scrollToBottom();
    }

    showTyping() {
        this.isTyping = true;
        this.typingIndicator.classList.add('active');
        this.sendButton.disabled = true;
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        this.typingIndicator.classList.remove('active');
        this.handleInput();
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatArea.scrollTop = this.chatArea.scrollHeight;
        }, 100);
    }

    focusInput() {
        setTimeout(() => this.messageInput.focus(), 100);
    }

    getTimestamp() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    getRecentHistory(limit = 5) {
        return this.messageHistory.slice(-limit);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new NextGenTherapyAI();
});