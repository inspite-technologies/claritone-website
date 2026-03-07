import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PRODUCT_METADATA } from '../data/product-metadata';

export interface Product {
    id: string;
    name: string;
    brand: string;
    category: string;
    price: number;
    rating: number;
    reviews: number;
    description: string;
    image: string;
    images: string[];
    features: string[];
    featuresObject: {
        battery: string;
        batteryLife: string;
        channels: string;
        noiseReduction: string;
        connectivity: string;
        waterResistance: string;
        warranty: string;
        style: string;
    };
    specifications: { label: string; value: string }[];
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    constructor(private api: ApiService) { }

    getProducts(): Observable<Product[]> {
        console.log('ProductService: Fetching products...');
        return this.api.get<any>('products').pipe(
            map(response => {
                console.log('ProductService: Raw response received:', response);
                const productsList = (response && (Array.isArray(response) ? response : (response.products || response.data || []))) || [];
                console.log('ProductService: Mapped products list count:', productsList.length);
                return productsList.map((p: any) => this.mapBackendProduct(p));
            })
        );
    }

    getProductById(id: string): Observable<Product> {
        return this.api.get<any>(`products/${id}`).pipe(
            map(response => {
                const productData = response.product || response.data || response;
                return this.mapBackendProduct(productData);
            })
        );
    }

    private mapBackendProduct(p: any): Product {
        const name = (p.name || '').toLowerCase();
        let metadata = PRODUCT_METADATA['default'];

        if (name.includes('phonak')) {
            metadata = PRODUCT_METADATA['Phonak Lumity L90-R'];
        } else if (name.includes('oticon')) {
            metadata = PRODUCT_METADATA['Oticon Real 1'];
        } else if (name.includes('signia')) {
            metadata = PRODUCT_METADATA['Signia Pure Charge&Go T AX'];
        }

        return {
            id: p._id || p.id,
            name: p.name || 'Unknown Product',
            brand: p.brand || 'Claritone',
            category: p.category || 'Hearing Aids',
            price: p.price || 0,
            rating: p.rating || 4.5,
            reviews: p.numReviews || p.reviews || Math.floor(Math.random() * 50) + 10,
            description: p.description || 'No description available for this product.',
            image: p.images && p.images.length > 0 ? p.images[0] : (p.image || 'https://via.placeholder.com/300x300.png?text=No+Image+Available'),
            images: p.images || (p.image ? [p.image] : ['https://via.placeholder.com/300x300.png?text=No+Image+Available']),
            features: p.features || metadata.features,
            featuresObject: p.featuresObject || metadata.featuresObject || {},
            specifications: p.specifications || metadata.specifications
        };
    }
}
