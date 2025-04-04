import { SearchOpportunitiesParams } from './types';

export const filterOpportunities = (
  params: Exclude<SearchOpportunitiesParams, 'stage'> & {
    stageQuery?: string;
  }
): string[] => {
  const { keyword, stageQuery, ownerId } = params;
  // Build conditions array for where clauses
  const conditions: string[] = [];

  if (keyword) {
    conditions.push(`Name LIKE '%${keyword}%'`);
  }

  if (stageQuery) {
    conditions.push(stageQuery);
  }

  if (ownerId) {
    conditions.push(`OwnerId = '${ownerId}'`);
  }

  return conditions;
};
