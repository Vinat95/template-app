import { Injectable } from "@angular/core";
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";
import { LoadingService } from "../services/loading.service";

@Injectable()
export class SpinnerInterceptor implements HttpInterceptor {
  private activeRequests = new Set<string>();
  constructor(private spinnerService: LoadingService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const requestId = `${req.method}:${req.urlWithParams}`;
    console.log(requestId);

    if (!this.activeRequests.has(requestId)) {
      //Non avvio l'interceptor piu volte sulla stessa chiamata
      this.activeRequests.add(requestId);
      this.spinnerService.show();
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (this.activeRequests.size > 0) {
          this.activeRequests.delete(requestId);
          this.spinnerService.hide();
        }
      })
    );
  }
}
