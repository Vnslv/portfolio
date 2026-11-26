import { Awards } from '@/components/Awards';
import { Footer } from '@/components/Footer';
import { Intro } from '@/components/Intro';
import { Links } from '@/components/Links';
import { Motion } from '@/components/Motion';
import { Taskbar } from '@/components/Taskbar';
import { Work } from '@/components/Work';
import { awards } from '@/content/awards';
import { projects } from '@/content/projects';
import { sectionsFor } from '@/lib/awards';
import styles from './page.module.css';

// Awards is hidden, and left out of the navigation, while no award shows (AWARD-01).
export default function Home() {
  const sections = sectionsFor(awards);
  return (
    <div className={styles.desk}>
      <div className={styles.page}>
        <div className={styles.column}>
          <main className={styles.main}>
            <Intro />
            <Awards awards={awards} />
            <Work projects={projects} />
            <Links />
          </main>
          <Footer />
        </div>
      </div>
      <Taskbar sections={sections} />
      <Motion />
    </div>
  );
}
