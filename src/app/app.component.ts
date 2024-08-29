import { Component, inject, OnInit } from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { NzLayoutModule } from "ng-zorro-antd/layout";
import { NzBreadCrumbModule } from "ng-zorro-antd/breadcrumb";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzMenuModule } from "ng-zorro-antd/menu";
import { NzFlexModule } from "ng-zorro-antd/flex";
import { NzAvatarModule } from "ng-zorro-antd/avatar";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { toSignal } from "@angular/core/rxjs-interop";
import { HttpClient } from "@angular/common/http";
import { catchError, of, switchMap, tap } from "rxjs";
import { AuthService } from "../auth.service";

type Size = "xxl" | "xl" | "lg" | "md" | "sm" | "xs" | null;

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
    NzIconModule,
    NzMenuModule,
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
  isCollapsed = true;
  currentSize: Size = "sm";
  userRole: string = "";
  isLargeScreen: boolean = true;

  constructor() {}

  ngOnInit() {
    //Responsive layout
    this.breakpointObserver
      .observe([Breakpoints.Large, Breakpoints.XLarge])
      .subscribe((result) => {
        this.isLargeScreen = result.matches;
      });

    //Role after login
    if (window.location.search.includes("code=")) {
      this.auth.handleRedirectCallback().subscribe((res) => {
        this.userRole = res[0];
      });
    } else {
      // Retrieve the user role from the service
      this.auth.userRole$.subscribe((role) => {
        this.userRole = role;
      });
    }
  }

  doLogin() {
    this.auth.doLogin();
  }

  doLogout() {
    this.auth.doLogout();
  }
}
