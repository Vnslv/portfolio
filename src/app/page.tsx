import { About } from '@/components/About';
import { Awards } from '@/components/Awards';
import { Footer } from '@/components/Footer';
import { Intro } from '@/components/Intro';
import { SectionNav } from '@/components/SectionNav';
import { Taskbar } from '@/components/Taskbar';
import { Window } from '@/components/Window';
import { Work } from '@/components/Work';
import { awards } from '@/content/awards';
import { projects } from '@/content/projects';
import { sectionsFor } from '@/lib/awards';
import styles from './page.module.css';

// Links is an empty window until its own ticket (T08). Awards is hidden, and left out of the
// navigation, while no award shows (AWARD-01).
export default function Home() {
  const sections = sectionsFor(awards);
  return (
    <div className={styles.desk}>
      <div className={styles.page}>
        <SectionNav sections={sections} />
        <div className={styles.column}>
          <main className={styles.main}>
            <Intro />
            <Awards awards={awards} />
            <Work projects={projects} />
            <div className={styles.two}>
              <About />
              <Window id="links" title="Links" icon="link" />
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <Taskbar sections={sections} />
    </div>
  );
}
