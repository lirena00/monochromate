# Monochromate

A sleek browser extension that turns your web browsing experience into grayscale, helping reduce digital distractions and avoid doomscrolling.

![Version](https://img.shields.io/badge/version-1.4.1-black)
![License](https://img.shields.io/badge/license-MIT-black)

<p align="center">
  <a href="https://chromewebstore.google.com/detail/monochromate/hafcajcllbjnoolpfngclfmmgpikdhlm">
    <img src="./public/chrome_badge.svg" alt="Chrome" />
  </a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/monochromate/">
    <img src="./public/firefox_badge.svg" alt="Firefox" />
  </a>
</p>

## ✨ Features

- **One-Click Toggle** - Instantly switch between color and grayscale modes
- **Intensity Control** - Fine-tune the grayscale effect (0-100%)
- **Site Exclusions** - Maintain a blacklist of sites where color should remain enabled
- **Smart Scheduling** - Automatically enable/disable monochrome mode at specific times
- **Real-time Updates** - Changes apply instantly without page refresh
- **Backup & Restore** - Export and import your settings configuration
- **Current Site Management** - Quick add/remove current website to exclusions
- **Fullscreen Support** - Seamlessly works with fullscreen content and videos
- **Search & Filter** - Easily find and manage excluded sites with search functionality
- **Minimal Interface** - Clean, modern UI with intuitive controls

## 🛠️ **Development**

### **Setup & Run**

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/monochromate.git
cd monochromate
pnpm install
```

Start the development server with:

```bash
pnpm dev
```

This will build the extension in **watch mode**, so changes automatically reflect when reloaded in the browser.

### **Building for Production**

To generate an optimized build:

```bash
pnpm zip
pnpm zip:firefox
```

This creates a final version inside the `dist/` folder, ready for submission to the Chrome Web Store and Mozilla Add-ons.

> for more detailed installation visit [WXT Guide](https://wxt.dev/guide/introduction.html)

## 🤝 **Contributing**

Want to improve **Monochromate**? Contributions are always welcome!

### **How to Contribute**

1. **Fork** the repository
2. **Create a new branch**: `git checkout -b feature-name`
3. **Make your changes**
4. **Commit & push**: `git commit -m "Added new feature"`
5. **Open a Pull Request** 🎉

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<div align="center">
Made with ♥️ for a more focused web
</div>
