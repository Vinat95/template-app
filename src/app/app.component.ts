import { Component, inject, OnInit } from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { NzLayoutModule } from "ng-zorro-antd/layout";
import { NzBreadCrumbModule } from "ng-zorro-antd/breadcrumb";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzAlertModule } from "ng-zorro-antd/alert";
import { NzMenuModule } from "ng-zorro-antd/menu";
import { NzFlexModule } from "ng-zorro-antd/flex";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { NzAvatarModule } from "ng-zorro-antd/avatar";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "./services/auth.service";
import { EMPTY, shareReplay, switchMap, take, tap } from "rxjs";
import { LoadingService } from "./services/loading.service";
import { AlertService } from "./services/alert.service";
import { environment } from "../environments/environment";

type Size = "xxl" | "xl" | "lg" | "md" | "sm" | "xs" | null;
type AlertType = "error" | "success" | "info" | "warning";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzBreadCrumbModule,
    NzAlertModule,
    NzIconModule,
    NzMenuModule,
    NzSpinModule,
    NzFlexModule,
    NzAvatarModule,
    NzDropDownModule,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  http = inject(HttpClient);
  breakpointObserver = inject(BreakpointObserver);
  document = inject(DOCUMENT);
  authenticated = this.auth.authenticated;
  user = this.auth.user;
  alert: {
    type: AlertType;
    message: string;
  } | null = null;
  isCollapsed = true;
  spinner = this.loadingService.loading$;
  currentSize: Size = "sm";
  userRole: string = "";
  isLargeScreen: boolean = true;
  userDetails: any;
  profileImageUrl: string = "";

  constructor(
    private loadingService: LoadingService,
    private alertService: AlertService
  ) {
    this.alertService.alert$.subscribe((alert) => {
      this.alert = alert;
    });
  }

  ngOnInit() {
    //Responsive layout
    this.breakpointObserver
      .observe([Breakpoints.Large, Breakpoints.XLarge])
      .subscribe((result) => {
        this.isLargeScreen = result.matches;
      });
    //Role after login
    this.auth
      .handleRedirectCallback()
      .pipe(
        take(1),
        tap((res: any) => {
          this.userRole = res[0] ? res[0][0] : [];
        }),
        switchMap(() => {
          if (this.auth.authenticated()) {
            return this.auth.getUserProfileImage();
          } else {
            return EMPTY; //non effettuare niente e completa
          }
        }),
        tap((res: any) => {
          this.auth.updateProfileImage(res.data);
        }),
        switchMap(() => this.auth.userState$)
      )
      .subscribe({
        next: (data) => {
          this.profileImageUrl = data.profileImage ? data.profileImage : "";
        },
        error: (err) => {
          this.alertService.showAlert("error", err.message);
        },
      });
  }

  doLogin() {
    this.auth.doLogin();
  }

  doLogout() {
    this.auth.doLogout();
  }

  getProfileImage(): string {
    if (!this.auth.authenticated()) return environment.initImage;
    else {
      return this.profileImageUrl || "";
    }
  }
}
