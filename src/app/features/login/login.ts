import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    isLoginMode = true;
    isOtpMode = false;
    loginForm = {
        fullName: '',
        phone: '',
        email: '',
        password: '',
        otp: ''
    };
    isLoading = false;
    private cdr = inject(ChangeDetectorRef);

    constructor(
        private apiService: ApiService,
        private router: Router,
        private toastr: ToastrService
    ) { }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
    }

    onSubmit() {
        if (!this.loginForm.email || !this.loginForm.password) {
            this.toastr.warning('Please enter both email and password', 'Warning');
            return;
        }

        if (!this.isLoginMode && (!this.loginForm.fullName || !this.loginForm.phone)) {
            this.toastr.warning('Please enter your full name and phone number to sign up', 'Warning');
            return;
        }

        this.isLoading = true;

        if (this.isLoginMode) {
            this.performLogin();
        } else {
            this.performRegister();
        }
    }

    performLogin() {
        const payload = {
            Email: this.loginForm.email,
            password: this.loginForm.password
        };

        this.apiService.post<any>('user/login', payload).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.cdr.detectChanges();
                if (res.success && res.token) {
                    localStorage.setItem('claritone_token', res.token);
                    this.toastr.success('Logged in successfully', 'Success');
                    this.router.navigate(['/']);
                } else {
                    this.toastr.error(res.message || 'Login failed', 'Error');
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.cdr.detectChanges();
                console.error('Login error', err);
                this.toastr.error(err.error?.message || 'Invalid email or password', 'Error');
            }
        });
    }

    performRegister() {
        const payload = {
            fullName: this.loginForm.fullName,
            Phone: this.loginForm.phone,
            Email: this.loginForm.email,
            password: this.loginForm.password,
            role: 'user'
        };

        this.apiService.post<any>('user/register', payload).subscribe({
            next: (res) => {
                console.log('Registration Success Response:', res);
                this.isLoading = false;
                if (res.success) {
                    this.isOtpMode = true;
                    this.toastr.success(res.message || 'OTP sent to your email.', 'OTP Sent');
                } else {
                    this.toastr.error(res.message || 'Registration failed', 'Error');
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.cdr.detectChanges();
                console.error('Registration error', err);
                this.toastr.error(err.error?.message || 'Email might already be in use', 'Error');
            }
        });
    }

    verifyOtp() {
        if (!this.loginForm.otp) {
            this.toastr.warning('Please enter the OTP', 'Warning');
            return;
        }

        this.isLoading = true;
        const payload = {
            Email: this.loginForm.email,
            otp: this.loginForm.otp
        };

        this.apiService.post<any>('user/verify-otp', payload).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.cdr.detectChanges();
                if (res.success) {
                    this.toastr.success('Signup successful. Please sign in.', 'Success');
                    this.isOtpMode = false;
                    this.isLoginMode = true;
                    this.loginForm = {
                        fullName: '',
                        phone: '',
                        email: '',
                        password: '',
                        otp: ''
                    };
                } else {
                    this.toastr.error(res.message || 'OTP verification failed', 'Error');
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.cdr.detectChanges();
                console.error('OTP verify error', err);
                this.toastr.error(err.error?.message || 'Invalid or expired OTP', 'Error');
            }
        });
    }
}
