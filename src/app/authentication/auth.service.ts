import { inject, Injectable } from "@angular/core";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { DOCUMENT } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { jwtDecode } from "jwt-decode";
import { UserAuth } from "../data/update-user.data";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private userRoleSubject = new BehaviorSubject<any>(null);
  userRole$ = this.userRoleSubject.asObservable();
  private profileImageSubject = new BehaviorSubject<string | null>(null);
  profileImage$ = this.profileImageSubject.asObservable();
  auth = inject(Auth0Service);
  http = inject(HttpClient);
  document = inject(DOCUMENT);
  authenticated = toSignal(this.auth.isAuthenticated$);
  user = toSignal(this.auth.user$);
  jwt: string = "";
  userRole: Array<string> = [];
  private auth0UrlSignUp =
    "https://dev-lwot5qle50opfs87.eu.auth0.com/dbconnections/signup";

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
          this.userRole = roles || [];
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

  getUserRoles(): string[] {
    return this.userRole;
  }

  registerUser(
    email: string,
    password: string,
    nickname: string,
    profileImage: string
  ) {
    const body = {
      client_id: "qnPQDHhKfJEZL8CfY0EdZpbEAWWaZo7D",
      email: email,
      picture: profileImage
        ? profileImage
        : "https://profile-image-template-app.s3.amazonaws.com/avatar-profile.jpg",
      password: password,
      connection: "Username-Password-Authentication",
      user_metadata: {
        nickname: nickname,
      },
    };

    return this.http.post(this.auth0UrlSignUp, body, {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
      }),
    });
  }

  getUserDetails(user_id: string) {
    return this.http.get(`http://localhost:3001/${user_id}/details`);
  }

  updateUserDetails(user_id: string, details: UserAuth) {
    return this.http.patch(`http://localhost:3001/${user_id}`, details);
  }

  uploadImageToS3Bucket(payload: any) {
    return this.http.post(`http://localhost:3001/upload/`, payload);
  }

  deleteImageFromS3Bucket(key: string) {
    return this.http.delete(`http://localhost:3001/upload/${key}`);
  }

  updateProfileImage(imageUrl: string) {
    this.profileImageSubject.next(imageUrl);
  }
}
