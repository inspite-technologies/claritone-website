import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../services/product.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-wishlist',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './wishlist.html',
    styleUrl: './wishlist.css'
})
export class Wishlist implements OnInit {
    wishlistItems: Product[] = [];

    constructor(
        private wishlistService: WishlistService,
        private cartService: CartService,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        this.wishlistService.wishlist$.subscribe(items => {
            this.wishlistItems = items;
        });
    }

    removeItem(productId: string) {
        this.wishlistService.removeFromWishlist(productId);
    }

    addToCart(product: Product) {
        this.cartService.addToCart(product, 1);
        this.wishlistService.removeFromWishlist(product.id);
        this.toastr.success(`${product.name} added to cart!`, 'Success');
    }

    formatPrice(price: number): string {
        return '$' + price.toLocaleString('en-US');
    }
}
