import { profile } from '@/content/profile';
import { copyrightLine } from '@/lib/site';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>{copyrightLine(profile.name)}</span>
    </footer>
  );
}
