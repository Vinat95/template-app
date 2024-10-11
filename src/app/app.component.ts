import { Component, inject, OnInit } from "@angular/core";
import { CommonModule, DOCUMENT } from "@angular/common";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { NzLayoutModule } from "ng-zorro-antd/layout";
import { NzBreadCrumbModule } from "ng-zorro-antd/breadcrumb";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzMenuModule } from "ng-zorro-antd/menu";
import { NzFlexModule } from "ng-zorro-antd/flex";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { NzAvatarModule } from "ng-zorro-antd/avatar";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "./authentication/auth.service";
import { switchMap, tap } from "rxjs";

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
  isCollapsed = true;
  spinner = false;
  currentSize: Size = "sm";
  userRole: string = "";
  isLargeScreen: boolean = true;
  userDetails: any;
  profileImageUrl: string = "";

  constructor() {}

  ngOnInit() {
    //Responsive layout
    this.breakpointObserver
      .observe([Breakpoints.Large, Breakpoints.XLarge])
      .subscribe((result) => {
        this.isLargeScreen = result.matches;
      });
    //Role after login
    this.spinner = true;
    this.auth
      .handleRedirectCallback()
      .pipe(
        tap((res: any) => {
          this.userRole = res[0][0];
        }),
        switchMap((res) => {
          return this.auth.getUserDetails(res[1]);
        }),
        tap((res: any) => {
          this.auth.updateProfileImage(res.data.picture);
        }),
        switchMap(() => this.auth.profileImage$)
      )
      .subscribe(
        (url) => {
          this.profileImageUrl = url ? url : "";
          this.spinner = false;
        },
        (err) => {
          console.log(err);
          this.spinner = false;
        }
      );
  }

  doLogin() {
    this.auth.doLogin();
  }

  doLogout() {
    this.auth.doLogout();
  }

  getProfileImage(): string {
    if (!this.auth.authenticated())
      return "https://profile-image-template-app.s3.amazonaws.com/avatar-profile.jpg";
    else {
      if (this.profileImageUrl) return this.profileImageUrl;
      else return "";
    }
  }
}
