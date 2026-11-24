import Link from 'next/link';
import { Window } from '@/components/Window';
import styles from './page.module.css';

export default function NotFound() {
  return (
    <div className={styles.desk}>
      <main className={styles.solo}>
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
  );
}
