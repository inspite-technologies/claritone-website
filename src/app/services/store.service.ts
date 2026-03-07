import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { AppointmentService, Language } from './appointment.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';

export interface Store {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    contact: string;
    hours?: {
        day: string;
        time: string;
    }[];
    status: string;
    mapLocation?: string;
}

@Injectable({
    providedIn: 'root'
})
export class StoreService {
    private storesSubject = new BehaviorSubject<Store[]>([]);
    stores$ = this.storesSubject.asObservable();

    private languagesSubject = new BehaviorSubject<Language[]>([]);
    languages$ = this.languagesSubject.asObservable();

    private isLoadingStoresSubject = new BehaviorSubject<boolean>(false);
    isLoadingStores$ = this.isLoadingStoresSubject.asObservable();

    private isLoaded = false;
    private isFetching = false;

    constructor(
        private apiService: ApiService,
        private appointmentService: AppointmentService
    ) { }

    loadInitialData() {
        if (this.isLoaded || this.isFetching) return;

        console.log('StoreService: Starting initial data load...');
        this.isFetching = true;
        this.isLoadingStoresSubject.next(true);

        // Load stores
        this.apiService.get<any>('stores').subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.storesSubject.next(res.data);
                }
                this.isLoadingStoresSubject.next(false);
                this.isLoaded = true;
                this.isFetching = false;
                console.log('StoreService: Stores loaded successfully');
            },
            error: (err) => {
                console.error('Failed to load stores in StoreService', err);
                this.isLoadingStoresSubject.next(false);
                this.isFetching = false;
            }
        });

        // Load languages
        this.appointmentService.getLanguages().subscribe({
            next: (langs) => this.languagesSubject.next(langs),
            error: (err) => console.error('Failed to load languages in StoreService', err)
        });
    }

    refreshData() {
        this.isLoaded = false;
        this.loadInitialData();
    }
}
