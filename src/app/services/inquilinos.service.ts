import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

// Definir una interfaz para la respuesta de la API
interface ViviendasResponse {
  data?: any[]; // Array de viviendas (opcional)
  message?: string; // Mensaje opcional
}

@Injectable({
  providedIn: 'root'
})
export class InquilinosService {
  private apiUrl = `${environment.apiUrl}/inquilinos`;
  private viviendasDisponiblesUrl = `${environment.apiUrl}/viviendas/disponibles`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token || ''}`);
  }

  getUserId(): number | null {
    return this.authService.getUserId();
  }

  getInquilinos(headers: HttpHeaders): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  getViviendasDisponibles(headers: HttpHeaders): Observable<any[] | ViviendasResponse> {
    return this.http.get<any[] | ViviendasResponse>(this.viviendasDisponiblesUrl, { headers });
  }

  createInquilino(data: any, headers: HttpHeaders): Observable<any> {
    return this.http.post(this.apiUrl, data, { headers });
  }

  updateInquilino(id: number, data: any, headers: HttpHeaders): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data, { headers });
  }

  deleteInquilino(id: number, headers: HttpHeaders): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}