import { About } from '@/components/About';
import { Footer } from '@/components/Footer';
import { Intro } from '@/components/Intro';
import { SectionNav } from '@/components/SectionNav';
import { Taskbar } from '@/components/Taskbar';
import { Window } from '@/components/Window';
import styles from './page.module.css';

// Awards, Work and Links are empty windows until their own tickets (T07, T06, T08).
export default function Home() {
  return (
    <div className={styles.desk}>
      <div className={styles.page}>
        <SectionNav />
        <div className={styles.column}>
          <main className={styles.main}>
            <Intro />
            <Window id="awards" title="Awards" icon="trophy" />
            <Window id="work" title="Work" icon="folder" />
            <div className={styles.two}>
              <About />
              <Window id="links" title="Links" icon="link" />
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <Taskbar />
    </div>
  );
}
