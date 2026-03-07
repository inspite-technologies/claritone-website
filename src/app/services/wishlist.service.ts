import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Product } from './product.service';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class WishlistService {
    private wishlistItems: Product[] = [];
    private wishlistSubject = new BehaviorSubject<Product[]>([]);
    public wishlist$ = this.wishlistSubject.asObservable();

    constructor(private api: ApiService, private router: Router) {
        this.loadWishlist();
    }

    private loadWishlist() {
        if (typeof window === 'undefined') return;
        // Fallback to local storage for instant load
        const savedWishlist = localStorage.getItem('claritone_wishlist');
        if (savedWishlist) {
            this.wishlistItems = JSON.parse(savedWishlist);
            this.wishlistSubject.next(this.wishlistItems);
        }

        // Sync with backend if logged in
        if (localStorage.getItem('claritone_token')) {
            this.api.get<any>('wishlist').subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.wishlistItems = res.data.map((p: any) => this.mapBackendProduct(p));
                        this.wishlistSubject.next(this.wishlistItems);
                        this.saveWishlistLocal();
                    }
                },
                error: (err) => console.error('Failed to load wishlist from backend', err)
            });
        }
    }

    private mapBackendProduct(p: any): Product {
        return {
            id: p._id || p.id,
            name: p.name,
            brand: p.brand || 'Claritone',
            category: p.category || 'Hearing Aids',
            price: p.price,
            rating: p.rating || 4.5,
            reviews: p.numReviews || p.reviews || 0,
            description: p.description || '',
            image: p.images?.length > 0 ? p.images[0] : (p.image || 'https://via.placeholder.com/300x300.png?text=No+Image'),
            images: p.images || (p.image ? [p.image] : []),
            features: p.features || [],
            featuresObject: p.featuresObject || {
                battery: 'N/A',
                batteryLife: 'N/A',
                channels: 'N/A',
                noiseReduction: 'N/A',
                connectivity: 'N/A',
                waterResistance: 'N/A',
                warranty: 'N/A',
                style: 'N/A'
            },
            specifications: p.specifications || []
        };
    }

    private saveWishlistLocal() {
        if (typeof window !== 'undefined') {
            localStorage.setItem('claritone_wishlist', JSON.stringify(this.wishlistItems));
        }
        this.wishlistSubject.next(this.wishlistItems);
    }

    addToWishlist(product: Product) {
        if (typeof window !== 'undefined' && !localStorage.getItem('claritone_token')) {
            this.router.navigate(['/login']);
            return;
        }

        const existingItem = this.wishlistItems.find(item => item.id === product.id);

        if (!existingItem) {
            this.wishlistItems.push(product);
            this.saveWishlistLocal();

            if (typeof window !== 'undefined' && localStorage.getItem('claritone_token')) {
                this.api.post<any>(`wishlist/${product.id}`, {}).subscribe({
                    error: (err) => console.error('Failed to sync add to wishlist', err)
                });
            }
        }
    }

    removeFromWishlist(productId: string) {
        this.wishlistItems = this.wishlistItems.filter(item => item.id !== productId);
        this.saveWishlistLocal();

        if (typeof window !== 'undefined' && localStorage.getItem('claritone_token')) {
            this.api.delete<any>(`wishlist/${productId}`).subscribe({
                error: (err) => console.error('Failed to sync remove from wishlist', err)
            });
        }
    }

    toggleWishlist(product: Product) {
        if (this.isInWishlist(product.id)) {
            this.removeFromWishlist(product.id);
        } else {
            this.addToWishlist(product);
        }
    }

    isInWishlist(productId: string): boolean {
        return this.wishlistItems.some(item => item.id === productId);
    }

    getWishlist(): Product[] {
        return this.wishlistItems;
    }

    clearWishlist() {
        this.wishlistItems = [];
        this.saveWishlistLocal();
    }
}
