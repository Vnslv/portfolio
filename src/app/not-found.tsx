import Link from 'next/link';
import { Taskbar } from '@/components/Taskbar';
import { Window } from '@/components/Window';
import styles from './page.module.css';

// As in board-b.html: the same page width and taskbar, the window in the content column.
export default function NotFound() {
  return (
    <div className={styles.desk}>
      <div className={styles.page}>
        <main className={`${styles.main} ${styles.second}`}>
          <Window title="Page not found" icon="doc" titleLevel={1}>
            <p className={styles.lead}>This address does not match anything here.</p>
            <div className={styles.row}>
              <Link className="button" href="/">
                Go to the home page
              </Link>
            </div>
          </Window>
        </main>
      </div>
      <Taskbar hrefBase="/" />
    </div>
  );
}
