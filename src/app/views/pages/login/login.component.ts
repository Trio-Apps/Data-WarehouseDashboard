import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardGroupComponent,
  ColComponent,
  ContainerComponent,
  FormControlDirective,
  FormDirective,
  InputGroupComponent,
  InputGroupTextDirective,
  RowComponent,
  FormCheckComponent,
  FormCheckInputDirective,
  FormCheckLabelDirective
} from '@coreui/angular';
import { AuthService } from '../Services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],

  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContainerComponent,
    RowComponent,
    ColComponent,
    CardGroupComponent,
    CardComponent,
    CardBodyComponent,
    FormDirective,
    InputGroupComponent,
    InputGroupTextDirective,
    IconDirective,
    FormControlDirective,
    ButtonDirective,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective
  ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private fb: FormBuilder,private authService: AuthService,
    private router: Router, private cdr: ChangeDetectorRef)
   {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      role: ['super-admin', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Check if user is already logged in
    // if (this.authService.isLoggedIn()) {
    //   this.router.navigate(['/dashboard']);
    // }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.errorMessage = '';

    const loginData = {
      email: this.loginForm.value.username,
      password: this.loginForm.value.password,
      role: this.loginForm.value.role,
      rememberMe: true
    };

    this.authService.login(loginData).subscribe({
      next: (res: any) => {
        console.log('Login response:', res);
        
        // Store token if available
        if (res.token) {
          this.authService.setToken(res.token);
                  this.cdr.detectChanges();

        }

        // // Store user data if available
        if (res.user.email) {
          this.authService.storeEmail(res.email);
                  this.cdr.detectChanges();

        }
       
        if (res.user.name) {
          this.authService.storeName(res.name);
                  this.cdr.detectChanges();

        }
        if (res.user.firstName) {
          this.authService.storeName(res.user.fullName);
                  this.cdr.detectChanges();

        }
       if (res.user.roles) {
          this.authService.storeRoles(res.user.roles);
                  this.cdr.detectChanges();

        }
        if(res.user.companyId){
          this.authService.storeCompanyId(res.user.companyId);
                  this.cdr.detectChanges();
        }
        this.loading = false;
        this.cdr.detectChanges();

        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = err.error?.message || 'Invalid username or password. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();

      }
    });
  }

  markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.loginForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'This field is required';
      }
    }
    return '';
  }
}
