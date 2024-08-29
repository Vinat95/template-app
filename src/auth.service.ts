import { inject, Injectable } from "@angular/core";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, filter, map, switchMap, tap } from "rxjs/operators";
import { DOCUMENT } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userRoleSubject = new BehaviorSubject<any>(this.getUserRoleFromStorage());
  userRole$ = this.userRoleSubject.asObservable();
  auth = inject(Auth0Service);
  http = inject(HttpClient);
  document = inject(DOCUMENT);
  authenticated = toSignal(this.auth.isAuthenticated$);
  user = toSignal(this.auth.user$);

  doLogin() {
    this.auth.loginWithRedirect();
  }

  doLogout() {
    this.auth.logout({
      logoutParams: {
        returnTo: this.document.location.origin,
      },
    });
    this.removeUserRoleFromStorage();
  }

  handleRedirectCallback(): Observable<any> {
    return this.auth.user$.pipe(
      filter((user) => !!user && !!user['https://my-public-api/roles']),
      map((user) => {
        return user!['https://my-public-api/roles'];
      }),
      tap((roles) => {
        if (roles && roles.length > 0) {
          const userRole = roles[0];
          this.saveUserRoleToStorage(userRole);
          this.userRoleSubject.next(userRole);
        }
      }),
      catchError((err) => {
        console.error("Error occurred while processing user roles:", err);
        return of(null);
      })
    );
  }

  private saveUserRoleToStorage(role: any) {
    localStorage.setItem("userRole", JSON.stringify(role));
  }

  private getUserRoleFromStorage(): any {
    const role = localStorage.getItem("userRole");
    return role ? JSON.parse(role) : null;
  }

  private removeUserRoleFromStorage() {
    localStorage.removeItem("userRole");
  }
}
