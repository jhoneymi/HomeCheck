import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FacturasService {
  private apiUrl = `${environment.apiUrl}/facturas`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('Token usado:', token);
    return new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
  }

  getFacturas(headers: HttpHeaders): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  getFacturasInquilino(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/inquilino`, { headers });
  }
}