import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private activeRequests = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  show() {
    this.activeRequests++;
    this.updateSpinner();
  }

  hide() {
    if (this.activeRequests > 0) {
      this.activeRequests--;
      this.updateSpinner();
    }
  }

  private updateSpinner() {
    this.loadingSubject.next(this.activeRequests > 0);
  }
}
