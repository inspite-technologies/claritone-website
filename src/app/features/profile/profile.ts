import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.html',
    styleUrl: './profile.css'
})
export class Profile implements OnInit {
    activeTab: 'info' | 'bookings' | 'orders' = 'info';

    user: any = null;
    bookings: any[] = [];
    orders: any[] = [];
    selectedOrder: any = null;
    showOrderModal: boolean = false;

    isLoading = {
        user: false,
        bookings: false,
        orders: false
    };

    updateForm = {
        fullName: '',
        Phone: '',
        Email: ''
    };

    constructor(
        private profileService: ProfileService,
        private toastr: ToastrService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadUserProfile();
        this.loadBookings();
        this.loadOrders();
    }

    loadUserProfile() {
        this.isLoading.user = true;
        this.profileService.getProfile().subscribe({
            next: (data) => {
                this.user = data;
                if (data) {
                    this.updateForm = {
                        fullName: data.fullName || '',
                        Phone: data.Phone || '',
                        Email: data.Email || ''
                    };
                }
                this.isLoading.user = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching profile', err);
                this.toastr.error('Failed to load profile details');
                this.isLoading.user = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadBookings() {
        this.isLoading.bookings = true;
        this.profileService.getMyAppointments().subscribe({
            next: (data) => {
                this.bookings = data;
                this.isLoading.bookings = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading bookings', err);
                this.isLoading.bookings = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadOrders() {
        this.isLoading.orders = true;
        this.profileService.getMyOrders().subscribe({
            next: (data) => {
                this.orders = data;
                this.isLoading.orders = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading orders', err);
                this.isLoading.orders = false;
                this.cdr.detectChanges();
            }
        });
    }

    setTab(tab: 'info' | 'bookings' | 'orders') {
        this.activeTab = tab;
        this.closeOrderDetails();
    }

    viewOrderDetails(order: any) {
        this.isLoading.orders = true;
        this.profileService.getOrderDetails(order._id).subscribe({
            next: (data) => {
                this.selectedOrder = data || order;
                this.showOrderModal = true;
                this.isLoading.orders = false;
                document.body.style.overflow = 'hidden';
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching order details', err);
                this.selectedOrder = order; // Fallback to list data
                this.showOrderModal = true;
                this.isLoading.orders = false;
                this.cdr.detectChanges();
            }
        });
    }

    closeOrderDetails() {
        this.selectedOrder = null;
        this.showOrderModal = false;
        document.body.style.overflow = 'auto'; // Restore scrolling
    }

    onUpdateProfile() {
        this.profileService.updateProfile(this.updateForm).subscribe({
            next: (res) => {
                if (res.success) {
                    this.toastr.success('Profile updated successfully');
                    this.user = { ...this.user, ...this.updateForm };
                } else {
                    this.toastr.error(res.message || 'Update failed');
                }
            },
            error: (err) => {
                this.toastr.error(err.error?.message || 'Failed to update profile');
            }
        });
    }

    getStatusColor(status: string): string {
        switch (status?.toLowerCase()) {
            case 'pending': return 'text-amber-600 bg-amber-50';
            case 'confirmed': return 'text-blue-600 bg-blue-50';
            case 'completed': return 'text-green-600 bg-green-50';
            case 'cancelled': return 'text-red-600 bg-red-50';
            case 'shipped': return 'text-purple-600 bg-purple-50';
            case 'delivered': return 'text-green-600 bg-green-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    }

    getFormattedOrderId(id: string): string {
        if (!id) return 'N/A';
        const cleanId = id.toString().replace(/^ORD-/, '').toUpperCase();
        return `ORD-${cleanId.length > 8 ? cleanId.substring(cleanId.length - 8) : cleanId}`;
    }

    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('claritone_token');
            this.toastr.success('Logged out successfully');
            this.router.navigate(['/']);
        }
    }
}
