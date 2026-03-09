import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService, Product } from '../../services/product.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-compare',
    imports: [CommonModule, RouterLink],
    templateUrl: './compare.html',
    styleUrl: './compare.css',
})
export class Compare {
    products: any[] = []; // Use any or update Product interface to include isExpertChoice/new features if strictly typed
    loading = true;
    error: string | null = null;

    // Define features to display in order
    comparisonFeatures = [
        { key: 'battery', label: 'Battery Type' },
        { key: 'batteryLife', label: 'Battery Life' },
        { key: 'channels', label: 'Processing Channels' },
        { key: 'noiseReduction', label: 'Noise Reduction' },
        { key: 'connectivity', label: 'Connectivity' },
        { key: 'waterResistance', label: 'Water Rating' },
        { key: 'warranty', label: 'Warranty' },
        { key: 'style', label: 'Style' }
    ];

    constructor(
        public cartService: CartService,
        private productService: ProductService,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        this.productService.getProducts().subscribe({
            next: (products) => {
                this.products = products;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load products', err);
                this.error = 'Failed to load products. Please try again later.';
                this.loading = false;
            }
        });
    }

    addToCart(product: Product) {
        this.cartService.addToCart(product, 1);
        this.toastr.success(`${product.name} added to cart!`, 'Success');
    }

    formatPrice(price: number): string {
        return '₹' + Math.round(price).toLocaleString('en-IN');
    }
}
