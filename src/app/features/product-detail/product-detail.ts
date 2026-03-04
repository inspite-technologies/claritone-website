import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService, Product } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './product-detail.html',
    styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
    product: Product | null = null;
    selectedImage: string = '';

    constructor(
        private route: ActivatedRoute,
        private productService: ProductService,
        private cartService: CartService,
        public wishlistService: WishlistService
    ) { }

    toggleWishlist() {
        if (this.product) {
            this.wishlistService.toggleWishlist(this.product);
        }
    }

    isInWishlist(): boolean {
        return this.product ? this.wishlistService.isInWishlist(this.product.id) : false;
    }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.productService.getProductById(id).subscribe({
                    next: (product) => {
                        this.product = product;
                        if (this.product && this.product.images.length > 0) {
                            this.selectedImage = this.product.images[0];
                        }
                    },
                    error: (err) => console.error('Failed to fetch product details', err)
                });
            }
        });
    }

    selectImage(img: string) {
        this.selectedImage = img;
    }

    addToCart() {
        if (this.product) {
            this.cartService.addToCart(this.product, 1);
            alert(`${this.product.name} added to cart!`);
        }
    }
}
