# FutureSight - Career Planning & Timeline Management App

FutureSight is a comprehensive career planning and timeline management application built with Next.js, designed to help students and professionals track their academic and career progress with AI-powered insights.

## 🌟 Features

- **Interactive Timeline View**: Visual timeline with milestone dots for exams, deadlines, and goals
- **Current Date Indicator**: Highlights today's position on your timeline
- **Today's Plan Card**: Daily schedule with micro-goals and motivational quotes
- **Career Management**: Dedicated sections for Career Goals, Skills, Career Vision, News, and Resources
- **AI-Powered Insights**: Motivational quotes and resource suggestions (static version for GitHub Pages)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Frosted Glass UI**: Modern, clean interface with subtle animations

## 🎨 Design Philosophy

- **Primary Color**: Deep slate blue (#4A6580) - evokes trust and preparedness
- **Background**: Light grayish-blue (#D0DCE5) - creates a soft, frosted glass effect
- **Accent Color**: Muted gold (#A2997A) - highlights key interactive elements
- **Typography**: 'Inter' for body text, 'Space Grotesk' for headlines
- **Minimalist Icons**: Clean representations of career stages and learning areas

## 🚀 Live Demo

Visit the live application: [https://hstreamapp.github.io/FutureSight/](https://hstreamapp.github.io/FutureSight/)

## 🛠️ Technology Stack

- **Framework**: Next.js 15.3.3 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **Authentication**: Firebase Auth (configurable)
- **Database**: Firestore (configurable)
- **AI Features**: Static implementation for GitHub Pages deployment
- **Deployment**: GitHub Pages with automated CI/CD

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/hstreamapp/FutureSight.git
   cd FutureSight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup (Optional)**
   Create a `.env.local` file for Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Build

```bash
npm run build
```

This creates an optimized static export in the `out/` directory, ready for deployment to GitHub Pages or any static hosting service.

## 🚀 Deployment

### GitHub Pages (Automated)

The repository includes GitHub Actions workflow for automatic deployment:

1. **Enable GitHub Pages** in your repository settings
2. **Set source** to "GitHub Actions"
3. **Push to master branch** - deployment happens automatically
4. **Optional**: Add Firebase environment variables as repository secrets for full functionality

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `out/` directory to your preferred static hosting service

## 📁 Project Structure

```
FutureSight/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── (app)/          # Main application pages
│   │   └── auth/           # Authentication pages
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   ├── auth/          # Authentication components
│   │   └── timeline/      # Timeline-specific components
│   ├── context/           # React context providers
│   ├── lib/               # Utility libraries and configurations
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── ai/                # AI-related functionality
├── docs/                  # Project documentation
├── .github/workflows/     # GitHub Actions CI/CD
└── public/               # Static assets
```

## 🎯 Key Components

### Timeline Management
- Interactive timeline with drag-and-drop functionality
- Milestone tracking for exams, deadlines, and personal goals
- Visual progress indicators

### Career Planning
- **Career Goals**: Set and track long-term objectives
- **Skills**: Monitor skill development and proficiency
- **Career Vision**: Define and refine career aspirations
- **Resources**: Curated learning materials and tools

### AI Features (Static Version)
- **Motivational Quotes**: Daily inspiration for goal achievement
- **Resource Suggestions**: Personalized learning recommendations based on skills and goals

## 🔧 Configuration

### GitHub Pages Setup
The application is pre-configured for GitHub Pages deployment with:
- Static export enabled
- Proper base path configuration
- Asset optimization for static hosting

### Firebase Integration
Firebase features are optional and gracefully degrade when not configured:
- Authentication system
- Real-time data synchronization
- User profile management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ashish Vasant Yesale**
- Email: ashishyesale007@gmail.com
- GitHub: [@hstreamapp](https://github.com/hstreamapp)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide React](https://lucide.dev/)

---

**FutureSight** - Empowering your journey towards academic and career success! 🚀
