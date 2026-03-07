import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Language {
    _id: string;
    name: string;
}

export interface Slot {
    _id: string;
    time: string;
}

export interface AppointmentPayload {
    fullName: string;
    phone: string;
    languageId: string;
    date: string;
    slotId: string;
    storeId: string;
    additionalNotes?: string;
    consultation?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    private showBookingModalSubject = new Subject<void>();
    showBookingModal$ = this.showBookingModalSubject.asObservable();

    constructor(private api: ApiService) { }

    triggerBookingModal() {
        this.showBookingModalSubject.next();
    }

    getLanguages(): Observable<Language[]> {
        return this.api.get<any>('languages').pipe(
            map(res => res.success ? res.data : [])
        );
    }

    getAvailableSlots(date: string, storeId?: string): Observable<Slot[]> {
        let url = `appointments/slots?date=${encodeURIComponent(date)}`;
        if (storeId) {
            url += `&storeId=${encodeURIComponent(storeId)}`;
        }
        return this.api.get<any>(url).pipe(
            map(res => res.success ? res.data : [])
        );
    }

    createAppointment(data: AppointmentPayload): Observable<any> {
        return this.api.post<any>('appointments', data);
    }
}
