'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { Project, ProjectImage, ReadyProject } from '../content/types';
import { roleLabel, teamLabel } from '../lib/projects';
import { Icon } from './Icon';
import styles from './ProjectCard.module.css';

type CopyState = { kind: 'idle' } | { kind: 'ok' } | { kind: 'failed'; url: string };

// The image space is reserved by CSS (aspect ratio) before the image loads. A failed image shows
// its description in the same space.
function ProjectPicture({ image }: { image: ProjectImage }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // An image can fail before the page hydrates, so the handler alone would miss it.
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
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
          onError={() => setFailed(true)}
        />
      )}
    </figure>
  );
}

function Details({ project, enhanced }: { project: ReadyProject; enhanced: boolean }) {
  const [copy, setCopy] = useState<CopyState>({ kind: 'idle' });

  async function copyLink() {
    const url = `${location.origin}${location.pathname}#${project.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopy({ kind: 'ok' });
    } catch {
      // The address is not logged: the message is fixed and carries no visitor data.
      console.warn('work: copy link failed');
      setCopy({ kind: 'failed', url });
    }
  }

  function close(button: HTMLButtonElement) {
    const details = button.closest('details');
    if (!details) return;
    details.open = false;
    details.querySelector('summary')?.focus();
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
          onClick={() => void copyLink()}
        >
          Copy link
        </button>
        <button
          type="button"
          className="button"
          disabled={!enhanced}
          onClick={(e) => close(e.currentTarget)}
        >
          Close
        </button>
      </div>
      <p className={styles.status} role="status">
        {copy.kind === 'ok' ? 'Link copied' : null}
        {copy.kind === 'failed' ? (
          <>
            Could not copy. The address is <span className={styles.address}>{copy.url}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}

// A ready project is a native details section, so it opens and closes without script and its
// text is in the page. All sections share one name, so opening one closes the others, as the
// board does. A project that is not ready has no section and cannot be opened (WORK-06).
export function ProjectCard({ project, enhanced }: { project: Project; enhanced: boolean }) {
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
  return (
    <li className={styles.project} id={project.id} data-project={project.id}>
      {project.ready ? (
        <details name="projects">
          <summary className={styles.head}>{head}</summary>
          <Details project={project} enhanced={enhanced} />
        </details>
      ) : (
        <div className={styles.head}>{head}</div>
      )}
    </li>
  );
}
