# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# Comically - Google Drive Comic Reader

A modern, client-side comic book reader that connects to your Google Drive to provide a professional reading experience for your CBR and CBZ files.

![Comically Screenshot](public/screenshot.png)

## ✨ Features

### 📚 Library Management

- **Google Drive Integration**: Seamlessly browse and access your comic files stored in Google Drive
- **Series Organization**: Automatically organizes comics by series folders
- **Search & Filter**: Quickly find comics with real-time search
- **Grid & List Views**: Choose your preferred library layout
- **Progress Tracking**: Remembers where you left off in each comic

### 🎮 Reading Experience

- **Professional Reader**: Smooth page navigation with gesture support
- **Multiple Fit Modes**: Fit to width, height, or page
- **Zoom & Pan**: Pinch-to-zoom and drag to navigate detailed pages
- **Reading Directions**: Support for both LTR and RTL (manga) reading
- **Fullscreen Mode**: Immersive reading experience
- **Touch & Keyboard Controls**: Navigate with touch gestures or keyboard shortcuts

### ⚙️ Customization

- **Reading Settings**: Customize fit mode, layout, and reading direction
- **Background Colors**: Choose from preset colors or set custom backgrounds
- **Progress Display**: Toggle progress bars and page numbers
- **Local Storage**: All preferences saved locally in your browser

### 🔒 Privacy & Security

- **Client-Side Only**: No server storage - everything runs in your browser
- **Read-Only Access**: Only requests read permissions for your Google Drive
- **Local Caching**: Comics are cached locally for offline reading
- **No Data Collection**: Your reading habits stay private

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Google account with comic files in Google Drive
- CBR or CBZ comic files organized in folders

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/comically.git
   cd comically
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Google Drive API** (if not already done)

   - The app comes pre-configured with a Google Client ID
   - If you need to set up your own, create a project in the [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Google Drive API
   - Create credentials (OAuth 2.0 Client ID)
   - Update the `VITE_GOOGLE_CLIENT_ID` in `.env`

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Recommended Folder Structure

Organize your comics in Google Drive like this:

```
📁 Comics/
├── 📁 Batman/
│   ├── 📄 Batman #1.cbr
│   ├── 📄 Batman #2.cbr
│   └── 📄 Batman #3.cbr
├── 📁 Spider-Man/
│   ├── 📄 Amazing Spider-Man #1.cbz
│   ├── 📄 Amazing Spider-Man #2.cbz
│   └── 📄 Amazing Spider-Man #3.cbz
└── 📁 Manga Series/
    ├── 📄 Chapter 001.cbr
    ├── 📄 Chapter 002.cbr
    └── 📄 Chapter 003.cbr
```

## ⌨️ Keyboard Shortcuts

| Action        | Shortcut        |
| ------------- | --------------- |
| Next Page     | `→` or `Space`  |
| Previous Page | `←`             |
| Zoom In       | `+`             |
| Zoom Out      | `-`             |
| Reset Zoom    | `0`             |
| Fullscreen    | `F`             |
| Exit/Back     | `Esc`           |
| Zoom (Mouse)  | `Ctrl + Scroll` |

## 🎮 Touch Gestures

- **Tap**: Show/hide controls
- **Left/Right Tap**: Navigate pages
- **Pinch**: Zoom in/out
- **Drag**: Pan when zoomed
- **Double Tap**: Reset zoom

## 🛠️ Technical Details

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **File Processing**: JSZip for CBR/CBZ extraction
- **Animations**: React Spring
- **Gestures**: @use-gesture/react
- **Storage**: LocalForage for offline caching
- **Authentication**: Google OAuth 2.0

### Supported Formats

- **CBR**: Comic Book RAR archives
- **CBZ**: Comic Book ZIP archives
- **Image Types**: JPEG, PNG, GIF, BMP, WebP

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔧 Configuration

### Environment Variables

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Storage Management

The app automatically manages storage but provides options to:

- Clear all cached data
- Remove comics not read in 30 days
- View current cache usage

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Use TypeScript for all new code
- Follow the existing code style
- Add appropriate error handling
- Test on multiple devices and browsers
- Update documentation as needed

## 📱 Mobile Support

Comically is fully responsive and optimized for mobile devices:

- Touch-friendly interface
- Gesture navigation
- Optimized layouts for small screens
- Progressive Web App (PWA) support

## 🔐 Privacy Policy

Comically is designed with privacy in mind:

- **No Server Storage**: All data is stored locally in your browser
- **Minimal Permissions**: Only requests read access to your Google Drive
- **No Tracking**: No analytics or user tracking
- **Open Source**: Code is transparent and auditable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Drive API for cloud storage integration
- React Spring for smooth animations
- Tailwind CSS for styling
- JSZip for archive processing
- All the open-source contributors who made this project possible

## 📞 Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Check the [Wiki](https://github.com/yourusername/comically/wiki) for common solutions
- Review the [FAQ](https://github.com/yourusername/comically/wiki/FAQ)

---

Made with ❤️ for comic book enthusiasts

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
