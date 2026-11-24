import { useId, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Window.module.css';

type WindowProps = {
  id?: string;
  title: string;
  icon: IconName;
  status?: string;
  // The not-found window holds the page's only heading, so it is a level 1.
  titleLevel?: 1 | 2;
  children?: ReactNode;
};

export function Window({ id, title, icon, status, titleLevel = 2, children }: WindowProps) {
  const titleId = useId();
  const Title = titleLevel === 1 ? 'h1' : 'h2';
  return (
    <section className={styles.win} id={id} tabIndex={-1} aria-labelledby={titleId}>
      <Title className={styles.title} id={titleId}>
        <Icon name={icon} />
        {title}
      </Title>
      <div className={styles.body}>{children}</div>
      {status ? <p className={styles.status}>{status}</p> : null}
    </section>
  );
}
