import { inject, Injectable } from "@angular/core";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { DOCUMENT } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { jwtDecode } from "jwt-decode";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userRoleSubject = new BehaviorSubject<any>(null);
  userRole$ = this.userRoleSubject.asObservable();
  auth = inject(Auth0Service);
  http = inject(HttpClient);
  document = inject(DOCUMENT);
  authenticated = toSignal(this.auth.isAuthenticated$);
  user = toSignal(this.auth.user$);
  jwt: string = "";

  doLogin() {
    this.auth.loginWithRedirect();
  }

  doLogout() {
    this.auth.logout({
      logoutParams: {
        returnTo: this.document.location.origin,
      },
    });
  }

  handleRedirectCallback(): Observable<string[]> {
    return this.auth.idTokenClaims$.pipe(
      map((claims) => {
        if (claims) {
          this.jwt = claims.__raw;
          const decodedToken: any = jwtDecode(this.jwt);
          const roles = decodedToken["https://my-public-api/roles"];
          this.userRoleSubject.next(roles);
          return roles || [];
        }
        return [];
      }),
      catchError((err) => {
        console.error("Error occurred while processing user roles:", err);
        return of([]); // Ritorna un array vuoto in caso di errore
      })
    );
  }
}
