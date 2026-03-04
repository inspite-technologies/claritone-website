import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

@Component({
    selector: 'app-payment',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    templateUrl: './payment.html',
    styleUrl: './payment.css'
})
export class Payment implements OnInit {
    paymentMethod: 'card' | 'upi' | 'netbanking' = 'card';
    isProcessing = false;

    cardData = {
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    };

    upiId = '';

    constructor(
        public cartService: CartService,
        private router: Router
    ) { }

    ngOnInit() {
        if (this.cartService.getItemCount() === 0) {
            this.router.navigate(['/products']);
        }
    }

    processPayment() {
        this.isProcessing = true;

        // Simulate payment processing delay
        setTimeout(() => {
            this.isProcessing = false;
            // 90% success rate for simulation
            if (Math.random() > 0.1) {
                this.cartService.clearCart();
                this.router.navigate(['/payment/success']);
            } else {
                this.router.navigate(['/payment/failure']);
            }
        }, 2500);
    }

    get subtotal() { return this.cartService.getSubtotal(); }
    get tax() { return this.cartService.getTax(); }
    get total() { return this.cartService.getTotal(); }
}
