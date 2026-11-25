'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Award, ProjectImage } from '../content/types';
import { awardFacts, awardId, awardsToShow } from '../lib/awards';
import styles from './Awards.module.css';
import { Window } from './Window';

// The image space is reserved by CSS (aspect ratio) before the image loads. A failed image shows
// its description in the same space (AWARD-03).
function AwardPicture({ image }: { image: ProjectImage }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const logged = useRef(false);
  const fail = useCallback(() => {
    // Once per image. The message is the image path only: no visitor data.
    if (!logged.current) {
      logged.current = true;
      console.warn(`awards: image failed to load ${image.src}`);
    }
    setFailed(true);
  }, [image.src]);
  // An image can fail before the page hydrates, so the handler alone would miss it.
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) fail();
  }, [fail]);
  return (
    <figure className={styles.picture}>
      {failed ? (
        <p className={styles.broken}>{image.alt}</p>
      ) : (
        <Image
          ref={ref}
          src={image.src}
          alt={image.alt}
          fill
          unoptimized
          sizes="(min-width: 640px) 260px, 100vw"
          className={styles.img}
          onError={fail}
        />
      )}
    </figure>
  );
}

// The awards window. With no award to show there is no section at all (AWARD-01); the page
// leaves Awards out of the navigation in the same case.
export function Awards({ awards }: { awards: readonly Award[] }) {
  const shown = awardsToShow(awards);
  if (shown.length === 0) return null;
  return (
    <Window
      id="awards"
      title="Awards"
      icon="trophy"
      status={`${shown.length} ${shown.length === 1 ? 'award' : 'awards'}`}
    >
      <ul className={styles.list}>
        {shown.map((award) => {
          const facts = awardFacts(award);
          return (
            <li
              key={awardId(award)}
              id={awardId(award)}
              className={award.image ? `${styles.award} ${styles.withImage}` : styles.award}
            >
              {award.image ? <AwardPicture image={award.image} /> : null}
              <div className={styles.text}>
                <h3 className={styles.name}>{facts.heading}</h3>
                {facts.byline ? <p>{facts.byline}</p> : null}
                {facts.details.length > 0 ? <p>{facts.details.join('. ')}.</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Window>
  );
}
