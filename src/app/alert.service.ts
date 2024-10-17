import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

type AlertType = "error" | "success" | "info" | "warning";

@Injectable({
  providedIn: "root",
})
export class AlertService {
  private alertSubject = new Subject<{
    type: AlertType;
    message: string;
  } | null>();
  alert$ = this.alertSubject.asObservable();

  showAlert(type: AlertType, message: string) {
    this.alertSubject.next({ type, message });
  }

  hideAlert() {
    this.alertSubject.next(null);
  }
}
