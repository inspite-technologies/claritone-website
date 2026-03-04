import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = '/api'; // Relative URL, proxied to backend

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        const token = localStorage.getItem('claritone_token');
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    get<T>(endpoint: string): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { headers: this.getHeaders() });
    }

    post<T>(endpoint: string, data: any): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data, { headers: this.getHeaders() });
    }

    put<T>(endpoint: string, data: any): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data, { headers: this.getHeaders() });
    }

    delete<T>(endpoint: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, { headers: this.getHeaders() });
    }
}
