'use client';

import Image from 'next/image';
import { useState } from 'react';
import { profile as content } from '../content/profile';
import type { Profile, ProjectImage } from '../content/types';
import { INTRO_STRIP } from '../lib/site';
import { LinkItem } from './Links';
import { Window } from './Window';
import styles from './Intro.module.css';

// The picture space is reserved by CSS (aspect ratio) before the image loads. A failed image shows
// its description in the same space, with script (here) and without it (the browser draws the
// description of a failed image; the CSS keeps it readable).
// The picture shows the small copy when there is one (NFR-01); the photo is not a link.
function ProfilePhoto({ photo }: { photo: ProjectImage }) {
  const shown = photo.small ?? photo.src;
  const [failed, setFailed] = useState(false);
  // The message is the path that was requested, nothing else: no visitor data. The image is
  // unmounted when it fails, so it reports once. next/image sets the address again when it
  // mounts, so a failure before the page hydrates reaches this handler too.
  const fail = () => {
    console.warn(`profile: image failed to load ${shown}`);
    setFailed(true);
  };
  return (
    <figure className={failed ? `${styles.picture} ${styles.failed}` : styles.picture}>
      {failed ? (
        <p className={styles.broken}>{photo.alt}</p>
      ) : (
        <Image
          src={shown}
          alt={photo.alt}
          fill
          unoptimized
          loading="eager"
          sizes="(min-width: 640px) 180px, 108px"
          className={styles.img}
          onError={fail}
        />
      )}
    </figure>
  );
}

export function Intro({ profile = content }: { profile?: Profile }) {
  return (
    <Window id="welcome" title="Welcome" icon="home" status={INTRO_STRIP}>
      <div className={styles.intro}>
        {profile.photo ? (
          <ProfilePhoto photo={profile.photo} />
        ) : (
          /* Labeled placeholder with reserved space until the owner supplies a photo. */
          <div className={styles.photo}>&lt;your photo&gt;</div>
        )}
        <div className={styles.text}>
          <h1 className={styles.name}>{profile.name}</h1>
          <p className={styles.lead}>{profile.intro}</p>
          <div className={styles.row}>
            <a className="button" href="#work">
              See my projects
            </a>
            <LinkItem label="CV" icon="doc" url={profile.cvUrl} newTab={false} />
          </div>
        </div>
      </div>
    </Window>
  );
}
