import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService as Auth0Service } from "@auth0/auth0-angular";
import { AuthService } from "../services/auth.service";
import { catchError, map, of, switchMap, tap } from "rxjs";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const auth0Service = inject(Auth0Service);
  const router = inject(Router);

  return auth0Service.isAuthenticated$.pipe(
    switchMap((isAuthenticated) => {
      if (!isAuthenticated) {
        // Se non è autenticato, fai il redirect alla pagina di insuccesso
        return of(router.createUrlTree(["/unauthorized-page"]));
      }
      let roles: Array<String> = [];
      return authService.handleRedirectCallback().pipe(
        tap((res: any) => {
          // Salva i ruoli dell'utente
          roles = res[0] ? res[0][0] : [];
        }),
        map(() => {
          const requiredRoles = route.data["roles"] as Array<string>; // Ruoli necessari per accedere alla pagina

          // Controlla se l'utente ha i ruoli necessari
          if (
            !requiredRoles ||
            requiredRoles.some((role) =>
              roles.includes(role)
            )
          ) {
            // Se i ruoli dell'utente includono uno dei ruoli richiesti, consenti l'accesso
            return true;
          } else {
            // Altrimenti fai il redirect alla pagina di insuccesso
            return router.createUrlTree(["/unauthorized-page"]);
          }
        }),
        catchError((err) => {
          // In caso di errore, fai il redirect alla pagina di insuccesso
          console.error("Error occurred while checking roles:", err);
          return of(router.createUrlTree(["/unauthorized-page"]));
        })
      );
    })
  );
};

export const signupGuard: CanActivateFn = (route, state) => {
  const auth0Service = inject(Auth0Service);
  const router = inject(Router);

  return auth0Service.isAuthenticated$.pipe(
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return router.createUrlTree(["/home"]);
      }
      return true;
    }),
    catchError((err) => {
      // In caso di errore, fai il redirect alla pagina di insuccesso
      console.error("Error occurred while checking roles:", err);
      return of(router.createUrlTree(["/unauthorized-page"]));
    })
  );
};
