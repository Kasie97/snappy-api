import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

const client = createClient({
  url: 'ws://localhost:3000/graphql',
  webSocketImpl: WebSocket,
});

(async () => {
  console.log('🔌 Connecting to GraphQL subscription...');

  const onNext = (data: unknown) => console.log('📩', data);

  await new Promise<void>((resolve, reject) => {
    client.subscribe(
      {
        query: `subscription OnPostUpdate($postId: ID!) {
          onPostUpdate(postId: $postId) {
            postId
            likeCount
            dislikeCount
          }
        }`,
        variables: { postId: 'PUT_A_REAL_POST_ID_HERE' },
      },
      {
        next: onNext,
        error: (err) => {
          console.error('❌ Subscription error:', err);
          // Ensure the rejection reason is an Error instance
          reject(err instanceof Error ? err : new Error(String(err)));
        },
        complete: () => {
          console.log('✅ Subscription completed');
          resolve();
        },
      },
    );
  });
})().catch((err) => {
  // Handle any uncaught rejection from the top-level async IIFE
  console.error('Uncaught error in subscription client:', err);
  // optional: set non-zero exit code in a script context
  if (typeof process !== 'undefined') process.exitCode = 1;
});
