import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './forgot-password.html',
})
export class ForgotPassword {
    email: string = '';
    otp: string = '';
    password: string = '';
    confirmPassword: string = '';
    isLoading: boolean = false;
    isSent: boolean = false; // Phase 1 complete: OTP sent
    private cdr = inject(ChangeDetectorRef);

    constructor(
        private apiService: ApiService,
        private toastr: ToastrService,
        private router: Router
    ) { }

    onSubmitEmail() {
        if (!this.email) {
            this.toastr.warning('Please enter your email address', 'Warning');
            return;
        }

        this.isLoading = true;
        this.apiService.post<any>('user/forgot-password', { Email: this.email }).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success) {
                    this.isSent = true;
                    this.toastr.success('OTP sent to your email', 'Success');
                } else {
                    this.toastr.error(res.message || 'Failed to send OTP', 'Error');
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.toastr.error(err.error?.message || 'Something went wrong', 'Error');
                this.cdr.detectChanges();
            }
        });
    }

    onResetPassword() {
        if (!this.otp || !this.password || !this.confirmPassword) {
            this.toastr.warning('Please fill in all fields', 'Warning');
            return;
        }

        if (this.password !== this.confirmPassword) {
            this.toastr.error('Passwords do not match', 'Error');
            return;
        }

        if (this.password.length < 6) {
            this.toastr.warning('Password must be at least 6 characters', 'Warning');
            return;
        }

        this.isLoading = true;
        const payload = {
            Email: this.email,
            otp: this.otp,
            password: this.password
        };

        this.apiService.put<any>('user/reset-password-otp', payload).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.success) {
                    this.toastr.success('Password reset successfully. You can now login.', 'Success');
                    this.router.navigate(['/login']);
                } else {
                    this.toastr.error(res.message || 'Reset failed', 'Error');
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.toastr.error(err.error?.message || 'Invalid or expired OTP', 'Error');
                this.cdr.detectChanges();
            }
        });
    }
}
