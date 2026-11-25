import type { Award } from '../content/types';
import { awardFacts, awardId } from '../lib/awards';
import styles from './AwardBadge.module.css';
import { Icon } from './Icon';

// A plain link to the award's anchor in the awards section (AWARD-02). It shows the hackathon and
// placement only: the details are listed once, in that section.
export function AwardBadge({ award }: { award: Award }) {
  return (
    <a className={styles.badge} href={`#${awardId(award)}`}>
      <Icon name="trophy" size={16} />
      {awardFacts(award).heading}
    </a>
  );
}
