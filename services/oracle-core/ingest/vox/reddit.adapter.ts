import type { Signal } from '../../registry/schema';

/**
 * Vox Populi adapter for Reddit crypto subreddits.
 */
export async function fetchRedditSignals(): Promise<Signal[]> {
  // TODO: connect to Reddit API/PRAW equivalent, apply subreddit taxonomy mappings.
  return [];
}
