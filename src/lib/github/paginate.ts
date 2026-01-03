import { Observable } from 'rxjs';

export function doPaginate<T>(
  fetchPage: (page: number) => Promise<{ totalRows: number; resultItems: T[] }>,
): Observable<T> {
  return new Observable<T>((subscriber) => {
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
    })();
  });
}
