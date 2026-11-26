import { profile as content } from '../content/profile';
import type { Profile } from '../content/types';
import { Icon, type IconName } from './Icon';
import styles from './Links.module.css';
import { Window } from './Window';

type Item = { label: string; icon: IconName; url?: string; newTab: boolean };

// A supplied address is a link. A missing or blank one is a labeled placeholder that is not a
// link, never a dead or invented address. The CV is a plain link to the Drive address; the two
// profiles open in a new tab, which their names say.
export function LinkItem({ label, icon, url, newTab }: Item) {
  const address = url?.trim();
  if (!address) {
    return (
      <span className={styles.placeholder}>
        <Icon name={icon} />
        {`<your ${label} link>`}
      </span>
    );
  }
  return newTab ? (
    <a
      className="button"
      href={address}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (opens in a new tab)`}
    >
      <Icon name={icon} />
      {label}
    </a>
  ) : (
    <a className="button" href={address}>
      <Icon name={icon} />
      {`Download ${label}`}
    </a>
  );
}

export function Links({ profile = content }: { profile?: Profile }) {
  return (
    <Window id="links" title="Links" icon="link">
      <div className={styles.row}>
        <LinkItem label="GitHub" icon="link" url={profile.github} newTab />
        <LinkItem label="LinkedIn" icon="link" url={profile.linkedin} newTab />
        <LinkItem label="Resume" icon="doc" url={profile.cvUrl} newTab={false} />
      </div>
    </Window>
  );
}
