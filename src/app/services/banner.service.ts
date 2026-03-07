import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Banner {
    _id: string;
    imageUrl: string;
    status: string;
    priority: number;
}

export interface BannerResponse {
    success: boolean;
    data: Banner[];
}

@Injectable({
    providedIn: 'root'
})
export class BannerService {
    constructor(private api: ApiService) { }

    getActiveBanners(): Observable<BannerResponse> {
        return this.api.get<BannerResponse>('banners/active');
    }
}
