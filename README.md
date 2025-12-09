# Threads Planner

A robust, calendar-based content planning application designed specifically for **Threads**. 

Threads Planner helps creators organize their content strategy by combining high-level theme planning (Monthly/Weekly/Daily) with a powerful, AI-assisted thread editor.

## 🌟 Key Features

### 📅 Strategic Calendar
- **Monthly Overview**: Visualize your content density at a glance.
- **Hierarchical Planning**: Define **Monthly Themes**, **Weekly Focuses**, and **Daily Topics** to ensure content cohesion.
- **Status Tracking**: Visual indicators for Drafts, Scheduled, and Published posts.

### 🧵 Advanced Thread Editor
- **Chain Builder**: Visually compose multi-post thread chains.
- **Character Counter**: Real-time validation against the 500-character limit.
- **Drag-and-Drop UX**: Seamlessly add, edit, or delete segments in a chain.
- **Visual Preview**: "What you see is what you get" editor mimicking the actual Threads UI.

### 🤖 AI-Powered by Google Gemini
- **Magic Split**: Paste a long article or blog post, and the AI will intelligent breakdown the text into a perfectly formatted thread chain.
- **Idea Generator**: Stuck on what to write? The AI suggests topics based on your specific Daily and Monthly themes.
- **Content Polish**: One-click rewrite to make your hooks punchier and content more viral-worthy.

### 🎨 UX & Design
- **Dark Mode**: Fully supported, high-contrast dark theme for late-night planning.
- **Local Persistence**: All data is saved automatically to your browser's LocalStorage.

## 🛠️ Tech Stack

- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini 2.5 Flash (via `@google/genai` SDK)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 🚀 Getting Started

### Prerequisites

You need a valid Google Gemini API Key to use the AI features.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/threads-planner.git
   cd threads-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory and add your API key:
   ```env
   API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the application**
   ```bash
   npm start
   ```

## 📖 Usage Guide

### 1. The Calendar View
The main screen shows the current month.
- **Navigation**: Use the arrows in the header to switch months.
- **Monthly Goal**: Type your main focus for the month in the top-right card.
- **Weekly Themes**: Click on the input field inside any **Sunday** cell to set the theme for that week.

### 2. Planning a Day
Click on any day in the grid to open the **Sidebar**.
- **Daily Theme**: Set a specific topic for the day.
- **Add Post**: Click "New Post" to start writing.

### 3. Writing Threads
- **Single Post**: Just write in the first block.
- **Chain**: Click "Add to thread" to create a sequence.
- **Magic Split**: Click the "Magic Split" button, paste a long text block, and watch it turn into a chain automatically.
- **Polishing**: Hover over a segment and click the ✨ sparkle icon to improve the writing.

## 📁 Project Structure

```
/
├── components/
│   └── ThreadEditor.tsx    # The core editor UI with AI integration
├── services/
│   └── geminiService.ts    # API wrapper for Google GenAI interaction
├── App.tsx                 # Main calendar logic and state management
├── types.ts                # TypeScript interfaces for data models
├── index.html              # Entry HTML with Tailwind config
└── index.tsx               # React entry point
```

## 🔒 Privacy & Data

This application uses `localStorage` to save your content. Your plans stay in your browser and are not sent to any external server (except for the text sent to the Gemini API for processing when you explicitly use AI features).

