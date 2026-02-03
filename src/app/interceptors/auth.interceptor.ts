import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../views/pages/Services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip auth header for login requests
  if (req.url.includes('/Auth/login')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getToken();

  if (!token) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
