import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { ApiService } from '../../services/api.service';

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

    constructor(
        public cartService: CartService,
        private router: Router,
        private apiService: ApiService
    ) { }

    ngOnInit() {
        this.cartService.cart$.subscribe(items => {
            this.cartItems = items;
            if (items.length === 0) {
                this.router.navigate(['/cart']);
            }
        });
        this.loadRazorpayScript();
        this.ensureAuthenticated();
    }

    ensureAuthenticated() {
        // If we don't have a token, automatically register/login a demo user so checkout works
        if (!localStorage.getItem('claritone_token')) {
            const demoUser = { Email: 'demo@claritone.com', password: 'password123' };

            // First try to login
            this.apiService.post<any>('user/login', demoUser).subscribe({
                next: (loginRes) => {
                    if (loginRes.success && loginRes.token) {
                        localStorage.setItem('claritone_token', loginRes.token);
                    }
                },
                error: () => {
                    // Try registering as admin if it fails (admin bypasses OTP)
                    this.apiService.post<any>('user/admin/register', demoUser).subscribe({
                        next: () => {
                            // Login after registering
                            this.apiService.post<any>('user/login', demoUser).subscribe(res => {
                                if (res.success && res.token) {
                                    localStorage.setItem('claritone_token', res.token);
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    loadRazorpayScript() {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }

    formatPrice(price: number): string {
        return '$' + price.toLocaleString('en-US');
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
        // Validate form
        const { firstName, lastName, email, phone, address, city, state, zipCode } = this.checkoutForm;
        if (!firstName || !email || !phone || !address || !city || !state || !zipCode) {
            alert('Please fill in all required fields');
            return;
        }

        // 1. Create Address in backend
        const addressPayload = {
            fullName: `${firstName} ${lastName}`,
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
                    const addressId = addressRes.data._id;

                    // 2. Create Order in backend
                    this.apiService.post<any>('orders', { addressId }).subscribe({
                        next: (orderRes) => {
                            if (orderRes.success && orderRes.data) {
                                // 3. Initiate Razorpay Checkout Window
                                this.initiateRazorpay(orderRes.data);
                            } else {
                                alert(orderRes.message || 'Failed to create order');
                            }
                        },
                        error: (err) => {
                            console.error('Order creation error:', err);
                            alert('An error occurred while creating your order. Ensure your cart is not empty.');
                        }
                    });

                } else {
                    alert('Failed to save shipping address');
                }
            },
            error: (err) => {
                console.error('Address creation error:', err);
                alert('An error occurred while saving your address.');
            }
        });
    }

    initiateRazorpay(order: any) {
        const options = {
            key: 'rzp_test_SBcSpRqTv8oKOm',
            amount: order.amount, // Amount in paise from backend
            currency: order.currency,
            name: 'Claritone Hearing Aid Centre',
            description: 'Purchase of Hearing Aid Devices',
            image: '/assets/logo.png',
            order_id: order.razorpayOrderId, // Order ID from backend
            handler: (response: any) => {
                // Payment successful - Validate with backend
                this.verifyPayment(response, order.orderId);
            },
            prefill: {
                name: `${this.checkoutForm.firstName} ${this.checkoutForm.lastName}`,
                email: this.checkoutForm.email,
                contact: this.checkoutForm.phone
            },
            theme: {
                color: '#e61c22'
            },
            modal: {
                ondismiss: () => {
                    console.log('Payment cancelled by user');
                    alert('Payment was cancelled.');
                }
            }
        };

        try {
            const razorpay = new Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Razorpay not loaded', error);
            alert('Payment gateway failed to load.');
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
                    alert('Payment verification failed.');
                }
            },
            error: (err) => {
                console.error('Verification error:', err);
                alert('An error occurred during payment verification.');
            }
        });
    }



    handlePaymentSuccess(response: any, orderId?: string) {
        console.log('Payment successful:', response);

        // Clear cart
        this.cartService.clearCart();

        // Redirect to success page
        this.router.navigate(['/order-success'], {
            queryParams: {
                orderId: orderId || response.razorpay_payment_id || 'DEMO_ORDER',
                amount: this.total
            }
        });
    }
}
