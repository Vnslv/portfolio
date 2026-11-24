import { profile } from '@/content/profile';
import { Window } from './Window';

export function About() {
  return (
    <Window id="about" title="About" icon="person">
      <p>{profile.about}</p>
    </Window>
  );
}
