import { Router  } from '@angular/router';
import { CanMatchFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../views/pages/Services/auth.service';


export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login']);
};