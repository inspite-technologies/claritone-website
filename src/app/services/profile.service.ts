import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    constructor(private api: ApiService) { }

    getProfile(): Observable<any> {
        return this.api.get<any>('profile').pipe(
            map(res => res.success ? res.data : null)
        );
    }

    updateProfile(data: any): Observable<any> {
        return this.api.put<any>('profile', data);
    }

    getMyOrders(): Observable<any[]> {
        return this.api.get<any>('orders/myorders').pipe(
            map(res => res.success ? res.data : [])
        );
    }

    getOrderDetails(id: string): Observable<any> {
        return this.api.get<any>(`orders/${id}`).pipe(
            map(res => res.success ? res.data : null)
        );
    }

    getMyAppointments(): Observable<any[]> {
        return this.api.get<any>('bookings/history').pipe(
            map(res => res.success ? res.data : [])
        );
    }
}
