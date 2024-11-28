import { inject, Injectable } from "@angular/core";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { DOCUMENT } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { jwtDecode } from "jwt-decode";
import { UserAuth, UserLogin, UserRegister } from "../data/update-user.data";
import { UserState } from "../data/user-state.data";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userStateSubject = new BehaviorSubject<UserState>({
    profileImage: "",
  });
  userState$ = this.userStateSubject.asObservable();
  auth = inject(Auth0Service);
  http = inject(HttpClient);
  document = inject(DOCUMENT);
  authenticated = toSignal(this.auth.isAuthenticated$);
  user = toSignal(this.auth.user$);
  jwt: string = "";
  userRole: Array<string> = [];

  doLogin() {
    this.auth.loginWithRedirect();
  }

  login(user: UserLogin) {
    return this.http.post(`${environment.host}/users/login/`, user);
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
          const roles = decodedToken[environment.role];
          const userId = decodedToken.sub;
          this.userRole = roles || [];
          return [roles || [], userId];
        }
        return [];
      }),
      catchError((err) => {
        console.error("Error occurred while processing user roles:", err);
        return of([]); // Ritorna un array vuoto in caso di errore
      })
    );
  }

  getUserRoles(): string[] {
    return this.userRole;
  }

  registerUser(body: UserRegister) {
    return this.http.post(`${environment.host}/users/signup/`, body);
  }

  getUserDetails() {
    return this.http.get(
      `${environment.host}/users/${this.user()?.sub}/detail`
    );
  }

  getUserProfileImage() {
    return this.http.get(
      `${environment.host}/users/${this.user()?.sub}/profile-image`
    );
  }

  updateUserDetails(details: UserAuth) {
    return this.http.patch(
      `${environment.host}/users/${this.user()?.sub}`,
      details
    );
  }

  uploadImageToS3Bucket(payload: any) {
    return this.http.post(`${environment.host}/aws/upload/`, payload);
  }

  deleteImageFromS3Bucket(key: string) {
    return this.http.delete(`${environment.host}/aws/images/${key}`);
  }

  updateProfileImage(imageUrl: string) {
    const currentState = this.userStateSubject.value;
    this.userStateSubject.next({ ...currentState, profileImage: imageUrl });
  }
}
