import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-cart',
    imports: [CommonModule, RouterLink],
    templateUrl: './cart.html',
    styleUrl: './cart.css',
})
export class Cart implements OnInit {
    cartItems: CartItem[] = [];

    constructor(
        public cartService: CartService,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        this.cartService.cart$.subscribe(items => {
            this.cartItems = items;
        });
    }

    updateQuantity(productId: string, quantity: number) {
        this.cartService.updateQuantity(productId, quantity);
    }

    removeItem(productId: string) {
        this.cartService.removeFromCart(productId);
        this.toastr.success('Item removed from cart', 'Success');
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
}
