# Nexus Chat 🚀

> Next-Gen AI Conversations Platform

![Nexus Chat](static/nexus_chat_logo.png)

Nexus Chat is a modern, elegant chat interface for AI conversations. It provides a seamless experience for interacting with various AI models, featuring a beautiful dark theme interface and professional design.

## ✨ Features

- 🎨 Modern, eye-friendly dark theme interface
- 🔄 Multiple AI provider support (Gemini, OpenAI, Anthropic)
- 📝 Markdown support for rich text formatting
- 💾 Save and load conversation history
- 📤 Export conversations
- 🎯 Multiple specialized assistant templates:
  - Basic Assistant
  - Code Assistant
  - Writing Assistant
  - Data Analyst
- 🎨 Theme customization options
- ⚡ Real-time streaming responses
- 🔧 Configurable model settings

## 🚀 Quick Start

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/MuhammadHanan/nexus-chat.git
   cd nexus-chat
   ```

2. Create a `.env` file in the root directory with your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

3. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

### Manual Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/MuhammadHanan/nexus-chat.git
   cd nexus-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file as described above.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. In a separate terminal, start the backend server:
   ```bash
   npm run server
   ```

## 🛠️ Configuration

### AI Providers

Nexus Chat supports multiple AI providers:
- **Gemini** (Default)
- OpenAI
- Anthropic

To change the provider:
1. Click the ⚙️ Config button in the header
2. Select your preferred provider
3. Enter the corresponding model name

### Templates

Access pre-configured templates for different use cases:
- 📝 Basic Assistant: General conversation
- 💻 Code Assistant: Programming help
- ✍️ Writing Assistant: Content creation
- 📊 Data Analyst: Data analysis

### Themes

Choose from three elegant themes:
- Default Blue
- Royal Purple
- Ocean Blue

## 💡 Usage Tips

1. **Conversation Management**
   - Use `clear` to start a new conversation
   - Save important conversations using the 💾 button
   - Export conversations using the 📤 button

2. **Keyboard Shortcuts**
   - `Enter`: Send message
   - `Shift + Enter`: New line

3. **Templates**
   - Click the 📑 Templates button to access specialized assistants
   - Each template comes with optimized system prompts

## 🔧 Technical Stack

- **Frontend**:
  - Vanilla JavaScript
  - HTML5/CSS3
  - Vite for building
  - Modern ES6+ features

- **Backend**:
  - Node.js
  - Express
  - Various AI API integrations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

##  Acknowledgments

- Thanks to all AI providers for their APIs
- Inspired by modern developer tools and chat interfaces

---

© 2025 Nexus Chat | Developed by Muhammad Hanan
