import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { ProductService, Product } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';
import { ToastrService } from 'ngx-toastr';

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
    isLoading: boolean = true;
    error: string | null = null;

    constructor(
        private route: ActivatedRoute,
        private productService: ProductService,
        private cartService: CartService,
        public wishlistService: WishlistService,
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef,
        private location: Location
    ) { }

    goBack() {
        this.location.back();
    }

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
            console.log('ProductDetail init with ID:', id);
            if (id) {
                this.isLoading = true;
                this.error = null;
                this.productService.getProductById(id).subscribe({
                    next: (product) => {
                        console.log('ProductDetail received product:', product);
                        try {
                            this.product = product;
                            if (this.product && this.product.images && this.product.images.length > 0) {
                                this.selectedImage = this.product.images[0];
                            }
                        } catch (e) {
                            console.error('Error setting product data:', e);
                        } finally {
                            this.isLoading = false;
                            this.cdr.detectChanges();
                        }
                    },
                    error: (err) => {
                        console.error('Failed to fetch product details', err);
                        this.error = 'Failed to load product details. Please try again later.';
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    },
                    complete: () => {
                        console.log('Product API request completed');
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    }
                });
            } else {
                this.isLoading = false;
                this.error = 'Invalid product ID.';
            }
        });
    }

    selectImage(img: string) {
        this.selectedImage = img;
    }

    addToCart() {
        if (this.product) {
            this.cartService.addToCart(this.product, 1);
            this.toastr.success(`${this.product.name} added to cart!`, 'Success');
        }
    }
}
