'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { awards as ownerAwards } from '../content/awards';
import type { Award, Project, ProjectImage, ReadyProject } from '../content/types';
import { awardId, awardsForProject } from '../lib/awards';
import { roleLabel, teamLabel } from '../lib/projects';
import { AwardBadge } from './AwardBadge';
import badgeStyles from './AwardBadge.module.css';
import { Icon } from './Icon';
import styles from './ProjectCard.module.css';

// The image space is reserved by CSS (aspect ratio) before the image loads. A failed image shows
// its description in the same space.
function ProjectPicture({ image }: { image: ProjectImage }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const logged = useRef(false);
  const fail = useCallback(() => {
    // Once per image. The message is the image path only: no visitor data.
    if (!logged.current) {
      logged.current = true;
      console.warn(`work: image failed to load ${image.src}`);
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
          sizes="160px"
          className={styles.img}
          onError={fail}
        />
      )}
    </figure>
  );
}

type DetailsProps = { project: ReadyProject; enhanced: boolean; onClose: () => void };

function Details({ project, enhanced, onClose }: DetailsProps) {
  function close(button: HTMLButtonElement) {
    // The panel is inside the card's details element, or beside it on a card with a badge.
    const details = button.closest('li')?.querySelector('details');
    if (!details) return;
    details.open = false;
    details.querySelector('summary')?.focus();
    onClose();
  }

  return (
    <div className={styles.details}>
      {project.ownerRole ? <p className={styles.owner}>{project.ownerRole}</p> : null}
      <dl className={styles.facts}>
        <div>
          <dt>Problem</dt>
          <dd>{project.problem}</dd>
        </div>
        <div>
          <dt>What I did</dt>
          <dd>
            {project.work.line ? <p>{project.work.line}</p> : null}
            <ul className={styles.points}>
              {project.work.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </dd>
        </div>
        {project.stack ? (
          <div>
            <dt>Stack</dt>
            <dd>{project.stack}</dd>
          </div>
        ) : null}
      </dl>
      {project.images?.length ? (
        <div className={styles.pictures}>
          {project.images.map((image) => (
            <ProjectPicture key={image.src} image={image} />
          ))}
        </div>
      ) : null}
      <div className={styles.actions}>
        {project.links?.map((link) => (
          <a
            key={link.url}
            className="button"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.label}
          </a>
        ))}
        <button
          type="button"
          className="button"
          disabled={!enhanced}
          onClick={(e) => close(e.currentTarget)}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// A ready project is a native details section, so it opens and closes without script and its
// text is in the page. All sections share one name, so opening one closes the others, as the
// board does. A project that is not ready has no section and cannot be opened (WORK-06).
//
// A badge for each award the project won sits under the row, outside the summary, and links to
// that award in the awards section (AWARD-02). The awards default to the owner's content.
type ProjectCardProps = {
  project: Project;
  enhanced: boolean;
  onClose: () => void;
  awards?: readonly Award[];
};

export function ProjectCard({
  project,
  enhanced,
  onClose,
  awards = ownerAwards,
}: ProjectCardProps) {
  const team = teamLabel(project.teamSize);
  const head = (
    <>
      <span className={styles.icon}>
        <Icon name="folder" size={32} />
      </span>
      <h3 className={styles.name}>{project.name}</h3>
      <span className={styles.meta}>{roleLabel(project.roles)}</span>
      {project.ready ? (
        team ? (
          <span className={styles.meta}>{team}</span>
        ) : null
      ) : (
        <span className={styles.tag}>Coming soon</span>
      )}
    </>
  );
  const badges = awardsForProject(project, awards).map((award) => (
    <AwardBadge key={awardId(award)} award={award} />
  ));
  let body;
  if (!project.ready) {
    body = (
      <>
        <div className={styles.head}>{head}</div>
        {badges}
      </>
    );
  } else if (badges.length === 0) {
    body = (
      <details name="projects">
        <summary className={styles.head}>{head}</summary>
        <Details project={project} enhanced={enhanced} onClose={onClose} />
      </details>
    );
  } else {
    // As on the board, the badge sits between the row and the panel. A native details element
    // hides everything but its summary when closed, so here the details element holds only the
    // row, and the panel beside it is shown by CSS while the details element is open. That keeps
    // the badge in view on a closed card, the order row, badge, panel for the keyboard, and the
    // card opening without JavaScript.
    body = (
      <>
        <details name="projects">
          <summary className={styles.head}>{head}</summary>
        </details>
        {badges}
        <div className={badgeStyles.panel}>
          <Details project={project} enhanced={enhanced} onClose={onClose} />
        </div>
      </>
    );
  }
  return (
    <li className={styles.project} id={project.id} data-project={project.id}>
      {body}
    </li>
  );
}
