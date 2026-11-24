import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findClientSecretUses } from '../check-client-secrets.mjs';

test('flags a server env var in a client component', () => {
  const files = [{ path: 'app/pay.tsx', text: "'use client';\nconst k = process.env.STRIPE_SECRET_KEY;" }];
  assert.deepEqual(findClientSecretUses(files), [{ path: 'app/pay.tsx', name: 'STRIPE_SECRET_KEY' }]);
});

test('allows the same var in a server file', () => {
  const files = [{ path: 'app/api/pay.ts', text: 'const k = process.env.STRIPE_SECRET_KEY;' }];
  assert.deepEqual(findClientSecretUses(files), []);
});

test('allows NEXT_PUBLIC_ vars in client code', () => {
  const files = [{ path: 'app/a.tsx', text: '"use client"\nconst u = process.env.NEXT_PUBLIC_URL;' }];
  assert.deepEqual(findClientSecretUses(files), []);
});

test('detects use client after leading comments', () => {
  const files = [{ path: 'app/b.tsx', text: '// header\n/* note */\n"use client";\nprocess.env["DB_URL"]' }];
  assert.deepEqual(findClientSecretUses(files), [{ path: 'app/b.tsx', name: 'DB_URL' }]);
});
