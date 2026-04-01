## 🤝 **Contributing**

Want to improve **Monochromate**? Contributions are always welcome!

### **Development Setup**

1. **Clone the repository**
   ```bash
   git clone https://github.com/lirena00/monochromate.git
   cd monochromate
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables (optional)**
   
   If you want to test the support banner's live donation/stars progress bars:
   
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Buy Me a Coffee API token:
   ```
   VITE_BMC_API_TOKEN=your_bmc_api_token_here
   ```
   
   Get your token at: https://developers.buymeacoffee.com/#authentication
   
   *Note: The extension will work fine without this token; the progress bars will just show 0 values.*

4. **Start development**
   ```bash
   bun run dev           # Chrome
   bun run dev:firefox   # Firefox
   ```

### **How to Contribute**

1. **Fork** the repository
2. **Create a new branch**: `git checkout -b feature-name`
3. **Make your changes**
4. **Commit & push**: `git commit -m "Added new feature"`
5. **Open a Pull Request** 🎉
