# Matrix Terminal Portfolio Website Design

**Project:** Portfolio Website for Saif Shikalgar  
**Date:** May 5, 2026  
**Status:** Approved - Ready for Implementation

---

## 1. Vision & Aesthetic

A single-page Next.js portfolio with a **Classic Matrix/Terminal aesthetic**:
- **Color Palette:** Bright lime green (#00ff00) on pitch black (#000000)
- **Typography:** Monospace font (JetBrains Mono)
- **Vibe:** Authentic retro-tech with smooth animations and interactive elements
- **Core Features:** Animated typing effects, code reveals, expandable project cards

---

## 2. Key Sections

### 2.1 Hero/Landing Section
- Full-screen welcome with animated terminal-style greeting
- Typing effect: `$ whoami` → reveals name/role
- Animated background with subtle falling code (configurable opacity)
- Character-by-character intro text with blinking cursor
- CTA button to navigate to projects
- Terminal prompt showing quick stats (projects count, years coding, etc.)

### 2.2 Projects/Work Section
**Featured Projects:**
1. **Drive-by-Wire** (Autonomous Vehicle Control System) - Primary showcase
2. **FiberOpticCalc** (FTTH Professional Platform) - Primary showcase
3. Additional projects with flexible layout for future additions

**Layout:**
- Responsive grid (1 col mobile, 2 cols tablet, flexible desktop)
- Terminal-style glowing green card borders
- Each card shows: title, tagline, tech stack badges, "View Details" button

**Interactive Expansion:**
- Click to expand card with full details overlay
- Shows: description, achievements, tech stack, images/screenshots, links
- Smooth slide-up or fade-in animation
- Click outside to close

---

## 3. Technical Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14+ with TypeScript |
| Styling | Tailwind CSS + Custom CSS for animations |
| Animations | Framer Motion |
| Icons | React Icons |
| Typography | JetBrains Mono (Google Fonts) |
| Deployment | Vercel |

---

## 4. Visual Effects & Interactions

- **Glowing text:** Hover states with subtle glow/pulse effects
- **Typed text:** Project descriptions appear to be typed when expanded
- **Terminal cursor:** Optional blinking cursor in text areas
- **Smooth transitions:** All state changes animated
- **Responsive:** Mobile-first, maintains aesthetic on all screen sizes

---

## 5. Navigation & Structure

- Sticky header with logo and scroll-to-section anchors
- Smooth scroll between sections
- Minimal navigation (no traditional menus)
- Footer with social links, email, call-to-action

---

## 6. Project Content

### FiberOpticCalc
- **Role:** Lead Developer / Product Owner
- **Tech:** Kotlin, Jetpack Compose, MVVM, Google Drive REST API, OSM/Google Maps
- **Key Achievement:** 1.36K+ installs, 670+ active users, verified recurring revenue
- **Features:** Recursive optical power budget calculations, path-loss modeling, geospatial engineering

### Drive-by-Wire
- **Role:** Technical Lead & Department Head
- **Tech:** STM32 → ESP32, CAN bus, NVIDIA Jetson Nano, Linux
- **Key Achievement:** 1st Place in Adaptive Cruise Control, 3rd Place in AEB
- **Features:** 3-ECU fault-tolerant system, real-time sensor-actuator loops, crisis engineering

---

## 7. Future Expansion

Design accommodates:
- Additional project cards flowing naturally in grid
- Blog/articles section
- Skills/tech stack section
- Experience timeline
- Contact form
- Multiple color themes

---

## 8. Success Criteria

✅ Matrix/Terminal aesthetic is immediately recognizable  
✅ Hero section creates strong first impression with animations  
✅ Project cards are interactive and engaging  
✅ Content is easy to update and expand  
✅ Fast performance (animations are smooth, no jank)  
✅ Mobile-responsive and accessible  
