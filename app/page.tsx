import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SkillsSection from '@/components/SkillsSection';
import StoriesSection from '@/components/StoriesSection';
import ProjectsSection from '@/components/ProjectsSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="bg-ink-950 min-h-screen">
      <Header />
      <HeroSection />
      <SkillsSection />
      <StoriesSection />
      <ProjectsSection />
      <Footer />
    </main>
  );
}
