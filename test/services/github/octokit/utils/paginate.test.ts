import { expect } from '@jest/globals';
import { toArray } from 'rxjs/operators';
import { doPaginate } from '../../../../../src/services/github/octokit/utils/paginate.js';
import { lastValueFrom } from 'rxjs';

describe('doPaginate', () => {
  test('that the paginator should handle no results', async () => {
    const fetchPage = async () => {
      return {
        totalRows: 0,
        resultItems: [],
      };
    };

    const results = await lastValueFrom(doPaginate(fetchPage).pipe(toArray()));
    expect(results).toEqual([]);
  });

  test('that the paginator should handle a single page of results', async () => {
    const fetchPage = async () => {
      return {
        totalRows: 3,
        resultItems: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };
    };

    const results = await lastValueFrom(doPaginate(fetchPage).pipe(toArray()));
    expect(results).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  test('that the paginator should handle multiple pages of results', async () => {
    const fetchPage = async (page: number) => {
      if (page === 1) {
        return {
          totalRows: 5,
          resultItems: [{ id: 1 }, { id: 2 }, { id: 3 }],
        };
      }
      return {
        totalRows: 5,
        resultItems: [{ id: 4 }, { id: 5 }],
      };
    };

    const results = await lastValueFrom(doPaginate(fetchPage).pipe(toArray()));
    expect(results).toEqual([
      { id: 1 },
      { id: 2 },
      { id: 3 },
      { id: 4 },
      { id: 5 },
    ]);
  });
});
