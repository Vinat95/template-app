import { Routes } from '@angular/router';
import { authGuardFn } from '@auth0/auth0-angular';
import NotFoundComponent from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component'),
    data: {
      breadcrumb: 'Home',
    },
  },
  {
    path: 'next',
    loadComponent: () => import('./nextpage/nextpage.component'),
    canActivate: [authGuardFn],
    data: {
      breadcrumb: 'Next',
    },
  },
  { path: '404', component: NotFoundComponent },
  { path: '**', redirectTo: '/404' },
];
