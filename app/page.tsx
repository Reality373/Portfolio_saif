import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SkillsSection from '@/components/SkillsSection';
import StoriesSection from '@/components/StoriesSection';
import InteractiveDemos from '@/components/InteractiveDemos';
import ProjectsSection from '@/components/ProjectsSection';
import Footer from '@/components/Footer';
import CommandPalette from '@/components/CommandPalette';
import InteractiveHUDControls from '@/components/InteractiveHUDControls';
import ScopeCursor from '@/components/ScopeCursor';
import SignalBus from '@/components/SignalBus';
import CrtOverlay from '@/components/CrtOverlay';

export default function Home() {
  return (
    <main className="bg-ink-950 min-h-screen relative">
      <Header />
      <HeroSection />
      <SkillsSection />
      <StoriesSection />
      <InteractiveDemos />
      <ProjectsSection />
      <Footer />
      <CommandPalette />
      <InteractiveHUDControls />
      <SignalBus />
      <CrtOverlay />
      <ScopeCursor />
    </main>
  );
}
