# 🧢 Flappy Ryan

A modern, mobile-first recreation of **Flappy Bird** starring **Ryan**! Built with vanilla HTML5 Canvas, CSS3 glassmorphism, and Web Audio API sound effects—zero build steps required, making it ready to host directly on **GitHub Pages**.

## ✨ Features

- **Custom Ryan Bird**: Features Ryan's cutout head & cap with an animated feathered bird body, flapping wings, and particle trails (plus a toggleable Golden Badge avatar style via the `🧢` button).
- **100% Mobile Friendly**:
  - Instant touch response (`pointerdown` with `touch-action: none` to prevent accidental zooming or scrolling).
  - Full-height dynamic viewport (`100dvh`) and iOS safe-area support.
  - Web Share API integration to text your high score directly to friends.
  - Frame-rate independent physics (plays identically on 60Hz, 90Hz, and 120Hz ProMotion screens).
- **3 Sky Themes**: Cycle between **Sunset Cruise** (🌅), **Bluebird Day** (🌤️), and **Neon Night** (🌃) using the top-right theme button.
- **3 Difficulty Modes**: **Chill**, **Classic**, and **Turbo**.
- **Built-in Web Audio Synth**: Crisp flap, score, milestone, and crash sound effects with zero external audio assets needed.

## 🚀 How to Publish on GitHub Pages

1. Create a new repository on GitHub (e.g. `flappy-ryan`).
2. Push this folder to your repository:
   ```bash
   cd C:\Users\chand\flappy-ryan
   git remote add origin https://github.com/<your-username>/flappy-ryan.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**, and under **Build and deployment**, select **Deploy from a branch** → `main` / `/ (root)` and click **Save**.
4. Share the `https://<your-username>.github.io/flappy-ryan/` link with your friends!
