export const SORTING = {
  LATEST_CREATED: {
    label: 'sorting.latestCreated',
    value: 'latest_created',
  },
  OLDEST_CREATED: {
    label: 'sorting.oldestCreated',
    value: 'oldest_created',
  },
  RECENTLY_MODIFIED: {
    label: 'sorting.latestUpdated',
    value: 'recently_modified',
  },
  OLDEST_MODIFIED: {
    label: 'sorting.oldestUpdated',
    value: 'oldest_modified',
  },
} as const;

export interface SortOption {
  label: string;
  value: string;
}
