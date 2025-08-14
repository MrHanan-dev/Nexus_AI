// Theme Management
const themes = ['default', 'purple', 'blue'];
let currentTheme = 0;

export function initializeThemeSwitch() {
    const themeBtn = document.getElementById('theme-btn');
    themeBtn.addEventListener('click', cycleTheme);
}

function cycleTheme() {
    currentTheme = (currentTheme + 1) % themes.length;
    document.body.classList.remove(...themes.map(t => `theme-${t}`));
    if (currentTheme !== 0) {
        document.body.classList.add(`theme-${themes[currentTheme]}`);
    }
    showToast(`Theme changed to ${themes[currentTheme]}`);
}

// Templates
const templates = {
    assistant: {
        system: "You are a helpful assistant who provides clear and concise answers.",
        example: "How can I help you today?"
    },
    coder: {
        system: "You are an expert programming assistant with deep knowledge of multiple programming languages and best practices.",
        example: "What coding problem can I help you solve?"
    },
    writer: {
        system: "You are a skilled writing assistant with expertise in various writing styles and formats.",
        example: "What would you like help writing?"
    },
    analyst: {
        system: "You are a data analysis expert who can help interpret and visualize data effectively.",
        example: "What data would you like to analyze?"
    }
};

export function initializeTemplates() {
    const templateItems = document.querySelectorAll('.template-item');
    templateItems.forEach(item => {
        item.addEventListener('click', () => loadTemplate(item.dataset.template));
    });
}

function loadTemplate(templateName) {
    const template = templates[templateName];
    if (template) {
        const editor = document.getElementById('editor');
        editor.innerHTML = `@system: ${template.system}\n\n@user: ${template.example}`;
        showToast(`Loaded ${templateName} template`);
    }
}

// Status Bar
export function initializeStatusBar() {
    const editor = document.getElementById('editor');
    editor.addEventListener('input', updateStatusBar);
    updateStatusBar();
}

function updateStatusBar() {
    const editor = document.getElementById('editor');
    const text = editor.innerText;
    
    // Update character count
    const charCount = document.getElementById('char-count');
    charCount.textContent = `Characters: ${text.length}`;
    
    // Update word count
    const wordCount = document.getElementById('word-count');
    const words = text.trim().split(/\\s+/).filter(word => word.length > 0);
    wordCount.textContent = `Words: ${words.length}`;
}

// Message History
export function initializeHistory() {
    const editor = document.getElementById('editor');
    editor.addEventListener('input', updateHistory);
}

function updateHistory() {
    const editor = document.getElementById('editor');
    const historyList = document.getElementById('history-list');
    const messages = editor.innerText.split(/(@user:|@ai:)/).filter(msg => msg.trim().length > 0);
    
    historyList.innerHTML = messages.map((msg, i) => {
        if (msg === '@user:' || msg === '@ai:') return '';
        const type = i > 0 ? messages[i-1] : '@system:';
        return `<div class="history-item ${type.replace(':', '')}-message">
            <span class="message-type">${type}</span>
            <p>${msg.length > 50 ? msg.substring(0, 50) + '...' : msg}</p>
        </div>`;
    }).join('');
}

// Toast Notifications
export function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Export functionality
export function initializeExport() {
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', exportConversation);
}

function exportConversation() {
    const editor = document.getElementById('editor');
    const content = editor.innerText;
    
    // Create export options
    const options = {
        markdown: () => convertToMarkdown(content),
        json: () => convertToJSON(content),
        txt: () => content
    };
    
    // Default to markdown
    const blob = new Blob([options.markdown()], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    
    showToast('Conversation exported successfully');
}

function convertToMarkdown(content) {
    return content
        .replace(/@system:/g, '## System\n')
        .replace(/@user:/g, '## User\n')
        .replace(/@ai:/g, '## Assistant\n');
}

function convertToJSON(content) {
    const messages = content.split(/(@system:|@user:|@ai:)/).filter(msg => msg.trim().length > 0);
    const conversation = [];
    
    for (let i = 0; i < messages.length; i += 2) {
        conversation.push({
            role: messages[i].replace(/[@:]/, ''),
            content: messages[i + 1].trim()
        });
    }
    
    return JSON.stringify({ messages: conversation }, null, 2);
}
