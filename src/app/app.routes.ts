import { Routes } from "@angular/router";
import { authGuardFn } from "@auth0/auth0-angular";
import NotFoundComponent from "./not-found/not-found.component";
import NotAuthorizedComponent from "./not-authorized/not-authorized.component";
import { authGuard, checkLoginsignupGuard } from "./guards/auth.guard";

export const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  {
    path: "home",
    loadComponent: () => import("./home/home.component"),
    data: {
      breadcrumb: "Home",
    },
  },
  {
    path: "profile",
    loadComponent: () => import("./profile/profile.component"),
    canActivate: [authGuardFn],
    data: {
      breadcrumb: "Profile",
    },
  },
  {
    path: "admin-page",
    loadComponent: () => import("./admin-page/admin-page.component"),
    canActivate: [authGuard],
    data: {
      breadcrumb: "Admin page",
      roles: ["Admin"],
    },
  },
  {
    path: "login",
    loadComponent: () => import("./authentication/login/login.component"),
    canActivate: [checkLoginsignupGuard],
    data: {
      breadcrumb: "Login",
    },
  },
  {
    path: "signup",
    loadComponent: () => import("./authentication/signup/signup.component"),
    canActivate: [checkLoginsignupGuard],
    data: {
      breadcrumb: "Registrazione",
    },
  },
  {
    path: "unauthorized-page",
    component: NotAuthorizedComponent,
  },
  { path: "404", component: NotFoundComponent },
  { path: "**", redirectTo: "/404" },
];
