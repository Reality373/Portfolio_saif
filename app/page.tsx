import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SkillsSection from '@/components/SkillsSection';
import StoriesSection from '@/components/StoriesSection';
import InteractiveDemos from '@/components/InteractiveDemos';
import ProjectsSection from '@/components/ProjectsSection';
import Footer from '@/components/Footer';
import CommandPalette from '@/components/CommandPalette';

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
    </main>
  );
}
