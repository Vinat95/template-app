import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { routes } from "./app.routes";
import { NZ_ICONS } from "ng-zorro-antd/icon";
import { NZ_I18N, en_US } from "ng-zorro-antd/i18n";
import { IconDefinition } from "@ant-design/icons-angular";
import * as AllIcons from "@ant-design/icons-angular/icons";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { authHttpInterceptorFn, provideAuth0 } from "@auth0/auth0-angular";

const antDesignIcons = AllIcons as {
  [key: string]: IconDefinition;
};
const icons: IconDefinition[] = Object.keys(antDesignIcons).map(
  (key) => antDesignIcons[key]
);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: NZ_I18N, useValue: en_US },
    { provide: NZ_ICONS, useValue: icons },
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),
    importProvidersFrom([BrowserAnimationsModule]),
    provideRouter(routes),
    provideAuth0({
      domain: "dev-lwot5qle50opfs87.eu.auth0.com",
      clientId: "qnPQDHhKfJEZL8CfY0EdZpbEAWWaZo7D",
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: "https://dev-lwot5qle50opfs87.eu.auth0.com/api/v2/",
        scope: "openid profile email offline_access",
      },
      useRefreshTokens: true,
      cacheLocation: "localstorage",
      httpInterceptor: {
        allowedList: [{ uri: "http://localhost:3000/*" }],
      },
    }),
  ],
};
