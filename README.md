# The Exit Talk

<img src="./public/only%20icon.jpg" alt="Data Science & Analytics Club APSIT" width="200">

An AI-powered Q&A collection platform built for the **Data Science & Analytics Club APSIT** final event of Academic Year 2025-26.

## About

**The Exit Talk** is an interactive platform which was designed and developed to collect participant questions before a live Q&A session. Using advanced AI capabilities, the platform intelligently groups similar questions together, creating a more organized and efficient discussion experience. This enables speakers and moderators to identify key themes and provide comprehensive answers to clustered questions.

**Live Demo:** [https://the-exit-talk.vercel.app](https://the-exit-talk.vercel.app)

## Event Context

This project was created as the grand finale event for the Data Science & Analytics Club APSIT (Academic Year 2025-26). The platform streamlines the traditional Q&A format by:
- Collecting questions from participants in real-time
- Using AI to identify and group similar inquiries
- Reducing redundancy and improving session flow
- Enabling more focused and impactful discussions

## Tech Stack

- **Frontend:** React + Vite with JavaScript (60.5%)
- **Styling:** CSS (38.7%)
- **Markup:** HTML (0.8%)
- **Backend:** Supabase (Database & Real-time Updates)
- **AI Engine:** OpenRouter API (Question Clustering & Grouping)

## Features

- ✅ **Real-time Question Collection** - Participants submit questions during the event
- ✅ **AI-Powered Question Clustering** - Similar questions are automatically grouped together
- ✅ **Smart Categorization** - OpenRouter AI identifies themes and patterns
- ✅ **Clean UI** - Intuitive interface for seamless question submission
- ✅ **Live Updates** - Questions appear instantly with Supabase real-time sync
- ✅ **Responsive Design** - Works across all devices
- ✅ **Lightning Fast** - Built with Vite for optimal performance

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and API keys
- OpenRouter API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ArjyaDey06/the-exit-talk.git
   cd the-exit-talk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Usage

1. **Submit a Question:** Enter your question in the input field and submit
2. **View Questions:** See all submitted questions on the main feed
3. **AI Clustering:** The system automatically groups similar questions
4. **Live Updates:** Questions and clusters update in real-time

## Project Structure

```
the-exit-talk/
├── src/
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── services/          # API & Supabase integration
│   ├── styles/            # CSS files
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── public/                # Static assets
│   └── only icon.jpg      # Club logo
├── .env.local             # Environment variables (not committed)
├── vite.config.js         # Vite configuration
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `VITE_OPENROUTER_API_KEY` | Your OpenRouter API key for AI clustering |

## Build & Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Deployment

The project is deployed on **Vercel**. To deploy your own instance:

1. Push to your GitHub repository
2. Connect your repo to Vercel
3. Add environment variables in Vercel settings
4. Vercel will automatically detect Vite and deploy!

## Contributors

- **Arjya Dey** ([@ArjyaDey06](https://github.com/ArjyaDey06)) - Core Development & README Author
- **Azra Attar** ([@azraattar](https://github.com/azraattar)) - Co-Developer

## Contributing

Contributions are welcome! Whether it's bug fixes, feature enhancements, or improvements to the AI clustering logic, feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## Questions & Feedback

We'd love to hear your thoughts! 
- 💡 **Have suggestions?** Open an issue with the `suggestion` label
- 🐛 **Found a bug?** Report it with the `bug` label
- ❓ **Have questions?** Start a discussion in the repo

## License

This project is open source and available under the MIT License.

## Acknowledgments

- **Data Science & Analytics Club APSIT** - For the amazing platform to build this project
- **OpenRouter** - For powering our AI clustering engine
- **Supabase** - For the seamless backend infrastructure
- **Vite** - For the lightning-fast development experience
- **Vercel** - For hosting and deployment

---

**Built for meaningful conversations.** Made to enhance the Q&A experience. 🚀
