import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';
import { ProfileService } from '../../services/profile.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { take, finalize, catchError, timeout } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';

declare var Razorpay: any;

@Component({
    selector: 'app-checkout',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './checkout.html',
    styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
    cartItems: CartItem[] = [];

    checkoutForm = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: ''
    };

    savedAddresses: any[] = [];
    selectedAddress: any = null;
    showAddressForm: boolean = false;
    isLoadingAddresses: boolean = true;

    constructor(
        public cartService: CartService,
        private router: Router,
        private apiService: ApiService,
        private profileService: ProfileService,
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        console.log('Checkout: ngOnInit');
        this.cartService.cart$.subscribe(items => {
            this.cartItems = items;
            if (items.length === 0) {
                this.router.navigate(['/cart']);
            }
        });
        this.loadRazorpayScript();
        this.ensureAuthenticated();
        this.loadInitialData();
    }

    loadInitialData() {
        console.log('Checkout: Starting robust data load');
        this.isLoadingAddresses = true;

        forkJoin({
            profile: this.profileService.getProfile().pipe(take(1), catchError(err => {
                console.error('Checkout: Profile load failed', err);
                return of(null);
            })),
            addresses: this.profileService.getAddresses().pipe(take(1), catchError(err => {
                console.error('Checkout: Address load failed', err);
                return of([]);
            }))
        }).pipe(
            timeout(10000), // 10s fallback
            finalize(() => {
                console.log('Checkout: Data load cycle complete');
                this.isLoadingAddresses = false;
                this.cdr.detectChanges(); // Force UI update
            })
        ).subscribe({
            next: (data: any) => {
                console.log('Checkout: Data received successfully:', data);
                if (data.profile) {
                    const names = data.profile.fullName ? data.profile.fullName.trim().split(' ') : [];
                    this.checkoutForm.firstName = names[0] || '';
                    this.checkoutForm.lastName = names.slice(1).join(' ') || '';
                    this.checkoutForm.email = data.profile.email || '';
                    this.checkoutForm.phone = data.profile.phone || '';
                }
                this.savedAddresses = data.addresses || [];
                this.setInitialAddress();
            },
            error: (err) => {
                console.warn('Checkout: Data load timed out or fatal error', err);
                this.showAddressForm = true;
                // finalize will handle isLoadingAddresses = false
            }
        });
    }

    selectAddress(address: any) {
        this.selectedAddress = address;
        this.showAddressForm = false;
        // Optionally pre-fill form in case they want to edit, but for now we just use ID
        const names = address.fullName.split(' ');
        this.checkoutForm = {
            firstName: names[0] || '',
            lastName: names.slice(1).join(' ') || '',
            email: this.checkoutForm.email, // preserve email
            phone: address.phone,
            address: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode
        };
    }

    toggleAddressForm() {
        this.showAddressForm = !this.showAddressForm;
        if (this.showAddressForm) {
            this.selectedAddress = null;
            // Clear form for NEW address entry
            this.checkoutForm = {
                firstName: '',
                lastName: '',
                email: this.checkoutForm.email, // Keep email
                phone: '',
                address: '',
                city: '',
                state: '',
                zipCode: ''
            };
        } else {
            this.setInitialAddress();
        }
    }

    private setInitialAddress() {
        console.log('Checkout: setInitialAddress called');
        if (this.savedAddresses && this.savedAddresses.length > 0) {
            // Sort so default is first
            this.savedAddresses.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

            const defaultAddress = this.savedAddresses.find(a => a.isDefault);
            this.selectedAddress = defaultAddress || this.savedAddresses[0];
            this.showAddressForm = false;
            console.log('Checkout: Initial address set:', this.selectedAddress);
        } else {
            this.showAddressForm = true;
            this.selectedAddress = null;
            console.log('Checkout: No addresses found, showing form');
        }
    }

    selectSavedAddress(address: any) {
        console.log('Checkout: Manually selecting address:', address);
        this.selectedAddress = address;
        this.showAddressForm = false;
    }

    ensureAuthenticated() {
        if (typeof window === 'undefined') return;
        if (!localStorage.getItem('claritone_token')) {
            this.router.navigate(['/login']);
        }
    }

    loadRazorpayScript() {
        if (typeof document === 'undefined') return;
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }

    formatPrice(price: number): string {
        return '₹' + Math.round(price).toLocaleString('en-IN');
    }

    get subtotal(): number {
        return this.cartService.getSubtotal();
    }

    get tax(): number {
        return this.cartService.getTax();
    }

    get total(): number {
        return this.cartService.getTotal();
    }

    processPayment() {
        console.log('Checkout: processPayment called. showAddressForm:', this.showAddressForm, 'selectedAddress:', this.selectedAddress?._id);
        // Validate and process based on which mode we are in
        if (this.showAddressForm) {
            const { firstName, lastName, address, city, state, zipCode, phone } = this.checkoutForm;

            console.log('Checkout: Using new address form data');
            if (!address || !city || !state || !zipCode || !phone) {
                this.toastr.warning('Please fill in all required shipping fields', 'Warning');
                return;
            }

            // 1. Create Address in backend
            const addressPayload = {
                fullName: `${firstName} ${lastName}`.trim(),
                phone,
                street: address,
                city,
                state,
                zipCode,
                country: 'India', // default
                isDefault: true
            };

            this.apiService.post<any>('addresses', addressPayload).subscribe({
                next: (addressRes) => {
                    if (addressRes.success && addressRes.data) {
                        this.createOrder(addressRes.data._id);
                    } else {
                        this.toastr.error('Failed to save shipping address', 'Error');
                    }
                },
                error: (err) => {
                    console.error('Address creation error:', err);
                    this.toastr.error('An error occurred while saving your address.', 'Error');
                }
            });
        } else if (this.selectedAddress) {
            this.createOrder(this.selectedAddress._id);
        } else {
            this.toastr.warning('Please select or add a shipping address', 'Warning');
        }
    }

    createOrder(addressId: string) {
        console.log('Checkout: createOrder called with addressId:', addressId);
        // 2. Create Order in backend
        this.apiService.post<any>('orders', { addressId }).subscribe({
            next: (orderRes) => {
                console.log('Checkout: Order response received:', orderRes);
                if (orderRes.success && orderRes.data) {
                    // 3. Initiate Razorpay Checkout Window
                    this.initiateRazorpay(orderRes.data);
                } else {
                    this.toastr.error(orderRes.message || 'Failed to create order', 'Error');
                }
            },
            error: (err) => {
                console.error('Order creation error:', err);
                this.toastr.error('An error occurred while creating your order. Ensure your cart is not empty.', 'Error');
            }
        });
    }

    initiateRazorpay(order: any) {
        console.log('Checkout: initiateRazorpay called with order data:', order);
        let name = `${this.checkoutForm.firstName} ${this.checkoutForm.lastName}`.trim();
        let phone = this.checkoutForm.phone;
        const email = this.checkoutForm.email;

        if (this.selectedAddress && !this.showAddressForm) {
            name = this.selectedAddress.fullName;
            phone = this.selectedAddress.phone;
        }

        const options = {
            key: 'rzp_test_SBcSpRqTv8oKOm',
            amount: order.amount, // Amount in paise from backend
            currency: order.currency,
            name: 'Claritone Hearing Aid Centre',
            description: 'Purchase of Hearing Aid Devices',
            // image: '/assets/logo.png', // Removed to avoid CORS issue on localhost
            order_id: order.razorpayOrderId, // Order ID from backend
            handler: (response: any) => {
                // Payment successful - Validate with backend
                this.verifyPayment(response, order.orderId);
            },
            prefill: {
                name: name,
                email: email,
                contact: phone
            },
            theme: {
                color: '#e61c22'
            },
            modal: {
                ondismiss: () => {
                    console.log('Payment cancelled by user');
                    this.toastr.warning('Payment was cancelled.', 'Warning');
                }
            }
        };

        try {
            const razorpay = new Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Razorpay not loaded', error);
            this.toastr.error('Payment gateway failed to load.', 'Error');
        }
    }

    verifyPayment(response: any, orderId: string) {
        const verifyPayload = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
        };

        this.apiService.post<any>('orders/verify', verifyPayload).subscribe({
            next: (res) => {
                if (res.success) {
                    this.handlePaymentSuccess(response, orderId);
                } else {
                    this.toastr.error('Payment verification failed.', 'Error');
                }
            },
            error: (err) => {
                console.error('Verification error:', err);
                this.toastr.error('An error occurred during payment verification.', 'Error');
            }
        });
    }



    handlePaymentSuccess(response: any, orderId?: string) {
        console.log('Payment successful:', response);

        const orderAmount = this.total; // Capture total before clearing cart

        // Clear cart
        this.cartService.clearCart();

        // Redirect to success page
        this.router.navigate(['/order-success'], {
            queryParams: {
                orderId: orderId || response.razorpay_payment_id || 'DEMO_ORDER',
                amount: orderAmount
            }
        });
    }
}
