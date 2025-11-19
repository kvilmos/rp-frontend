import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs';
import { ResponseFrame } from '../common/interface/response_frame.interface';

export const responseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse) {
        const body = event.body as ResponseFrame<any>;

        if (body && typeof body.success === 'boolean') {
          if (body.success) {
            return event.clone({ body: body.data });
          } else {
            throw new HttpErrorResponse({
              error: body.message,
              status: event.status,
              statusText: 'API Business Logic Error',
            });
          }
        }
      }

      return event;
    })
  );
};
