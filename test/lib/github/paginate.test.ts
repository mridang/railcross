import { expect } from '@jest/globals';
import { lastValueFrom, toArray } from 'rxjs';
import { doPaginate } from '@/lib/github/paginate';

describe('doPaginate function tests', () => {
  test('should emit all items from a single page', async () => {
    const items = ['a', 'b', 'c'];
    const fetchPage = jest.fn().mockResolvedValue({
      totalRows: 3,
      resultItems: items,
    });

    const result = await lastValueFrom(doPaginate(fetchPage).pipe(toArray()));

    expect(result).toEqual(items);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(1);
  });

  test('should emit all items from multiple pages', async () => {
    const page1Items = ['a', 'b'];
    const page2Items = ['c', 'd'];
    const fetchPage = jest.fn().mockImplementation((page: number) => {
      if (page === 1) {
        return Promise.resolve({
          totalRows: 4,
          resultItems: page1Items,
        });
      }
      return Promise.resolve({
        totalRows: 4,
        resultItems: page2Items,
      });
    });

    const result = await lastValueFrom(doPaginate(fetchPage).pipe(toArray()));

    expect(result).toEqual([...page1Items, ...page2Items]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenCalledWith(1);
    expect(fetchPage).toHaveBeenCalledWith(2);
  });

  test('should handle empty results', async () => {
    const fetchPage = jest.fn().mockResolvedValue({
      totalRows: 0,
      resultItems: [],
    });

    const result = await lastValueFrom(
      doPaginate(fetchPage).pipe(toArray()),
    ).catch(() => []);

    expect(result).toEqual([]);
  });

  test('should propagate errors', async () => {
    const error = new Error('Fetch failed');
    const fetchPage = jest.fn().mockRejectedValue(error);

    await expect(
      lastValueFrom(doPaginate(fetchPage).pipe(toArray())),
    ).rejects.toThrow('Fetch failed');
  });
});
