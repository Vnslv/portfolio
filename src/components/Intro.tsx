import { profile } from '@/content/profile';
import { INTRO_STRIP } from '@/lib/site';
import { Window } from './Window';
import styles from './Intro.module.css';

export function Intro() {
  return (
    <Window id="welcome" title="Welcome" icon="home" status={INTRO_STRIP}>
      <div className={styles.intro}>
        {/* Labeled placeholder with reserved space until the owner supplies a photo. */}
        <div className={styles.photo}>&lt;your photo&gt;</div>
        <div className={styles.text}>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.lead}>{profile.intro}</p>
          <div className={styles.row}>
            <a className="button" href="#work">
              See my work
            </a>
          </div>
        </div>
      </div>
    </Window>
  );
}
