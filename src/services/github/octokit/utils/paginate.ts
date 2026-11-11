/**
 * @file Adapts a page-by-page GitHub API fetch into a single observable stream of items.
 */
import { Observable } from 'rxjs';

/**
 * Streams every item from a paginated API as one observable.
 *
 * The first page reports the total row count, which sets how many pages are
 * fetched in turn. Each item is emitted as its page arrives, and the stream
 * completes after the last page. A failed fetch errors the stream.
 * @template T - The type of a single item.
 * @param fetchPage - Fetches one page, numbered from 1, with its total row count and items.
 * @returns An observable that emits every item in order.
 * @example
 * ```ts
 * doPaginate(async (page) => ({
 *   totalRows: 2,
 *   resultItems: page === 1 ? ['a'] : ['b'],
 * })).subscribe((item) => console.log(item));
 * ```
 */
export function doPaginate<T>(
  fetchPage: (page: number) => Promise<{ totalRows: number; resultItems: T[] }>,
): Observable<T> {
  return new Observable<T>((subscriber) => {
    // The subscriber reports every outcome, so the promise needs no caller.
    void (async () => {
      try {
        const firstPage = await fetchPage(1);
        const totalPages = Math.ceil(
          firstPage.totalRows / firstPage.resultItems.length,
        );

        firstPage.resultItems.forEach((item) => subscriber.next(item));

        for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
          const { resultItems } = await fetchPage(pageNum);
          resultItems.forEach((item) => subscriber.next(item));
        }

        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    })(); // Immediately invoked async function expression
  });
}
