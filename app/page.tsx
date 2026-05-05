import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProjectsSection from '@/components/ProjectsSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="bg-matrix-bg">
      <Header />
      <HeroSection />
      <ProjectsSection />
      <Footer />
    </main>
  );
}
