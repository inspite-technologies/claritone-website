import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { Product } from './product.service';
import { Router } from '@angular/router';

export interface CartItem {
    product: Product;
    quantity: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cartItems: CartItem[] = [];
    private cartSubject = new BehaviorSubject<CartItem[]>([]);
    public cart$ = this.cartSubject.asObservable();

    constructor(private api: ApiService, private router: Router) {
        this.loadCart();
    }

    private loadCart() {
        if (typeof window === 'undefined') return;
        const savedCart = localStorage.getItem('claritone_cart');
        if (savedCart) {
            this.cartItems = JSON.parse(savedCart);
            this.cartSubject.next(this.cartItems);
        }

        if (localStorage.getItem('claritone_token')) {
            this.api.get<any>('cart').subscribe({
                next: (res) => {
                    if (res.success && res.data) {
                        this.cartItems = res.data.map((item: any) => ({
                            quantity: item.quantity,
                            product: this.mapBackendProduct(item.product)
                        }));
                        this.cartSubject.next(this.cartItems);
                        this.saveCartLocal();
                    }
                },
                error: (err) => console.error('Failed to load cart from backend', err)
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

    private saveCartLocal() {
        if (typeof window !== 'undefined') {
            localStorage.setItem('claritone_cart', JSON.stringify(this.cartItems));
        }
        this.cartSubject.next(this.cartItems);
    }

    addToCart(product: Product, quantity: number = 1) {
        if (typeof window !== 'undefined' && !localStorage.getItem('claritone_token')) {
            this.router.navigate(['/login']);
            return;
        }

        const existingItem = this.cartItems.find(item => item.product.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cartItems.push({ product, quantity });
        }

        this.saveCartLocal();

        if (typeof window !== 'undefined' && localStorage.getItem('claritone_token')) {
            this.api.post<any>(`cart/${product.id}`, { quantity }).subscribe({
                error: (err) => console.error('Failed to sync add to cart', err)
            });
        }
    }

    removeFromCart(productId: string) {
        this.cartItems = this.cartItems.filter(item => item.product.id !== productId);
        this.saveCartLocal();

        if (typeof window !== 'undefined' && localStorage.getItem('claritone_token')) {
            this.api.delete<any>(`cart/${productId}`).subscribe({
                error: (err) => console.error('Failed to sync remove from cart', err)
            });
        }
    }

    updateQuantity(productId: string, quantity: number) {
        const item = this.cartItems.find(item => item.product.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                this.saveCartLocal();

                if (typeof window !== 'undefined' && localStorage.getItem('claritone_token')) {
                    this.api.put<any>(`cart/${productId}`, { quantity }).subscribe({
                        error: (err) => console.error('Failed to sync update quantity', err)
                    });
                }
            }
        }
    }

    getCart(): CartItem[] {
        return this.cartItems;
    }

    getItemCount(): number {
        return this.cartItems.reduce((total, item) => total + item.quantity, 0);
    }

    getSubtotal(): number {
        return this.cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    }

    getTax(): number {
        return 0; // GST removed per user request to match backend
    }

    getTotal(): number {
        return this.getSubtotal();
    }

    clearCart() {
        this.cartItems = [];
        this.saveCartLocal();
    }
}
