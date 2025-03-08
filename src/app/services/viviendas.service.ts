import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface Vivienda {
  id: number;
  nombre: string;
  direccion: string;
  estado: 'Alquilada' | 'No Alquilada' | 'En Remodelacion...';
  img: string; // Solo string para datos recibidos de la API
  id_adm: number;
  fecha_registro?: string;
}

export interface ViviendaEdit {
  id: number;
  nombre?: string;
  direccion?: string;
  estado?: 'Alquilada' | 'No Alquilada' | 'En Remodelacion...';
  img?: string | File; // Permite string o File solo para edición
  id_adm?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ViviendasService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getViviendas(): Observable<Vivienda[]> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
    return this.http.get<Vivienda[]>(`${this.apiUrl}/viviendas`, { headers });
  }

  addVivienda(vivienda: any): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = new FormData();
    formData.append('nombre', vivienda.nombre);
    formData.append('direccion', vivienda.direccion);
    formData.append('estado', vivienda.estado);
    formData.append('img', vivienda.img);
    formData.append('id_adm', vivienda.id_adm.toString());

    return this.http.post<any>(`${this.apiUrl}/viviendas`, formData, { headers });
  }

  updateVivienda(id: number, vivienda: ViviendaEdit): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = new FormData();

    if (vivienda.nombre !== undefined) formData.append('nombre', vivienda.nombre);
    if (vivienda.direccion !== undefined) formData.append('direccion', vivienda.direccion);
    if (vivienda.estado !== undefined) formData.append('estado', vivienda.estado);
    if (vivienda.img instanceof File) {
      formData.append('img', vivienda.img);
    } else if (vivienda.img !== undefined) {
      formData.append('img', vivienda.img);
    }
    if (vivienda.id_adm !== undefined) formData.append('id_adm', vivienda.id_adm.toString());

    return this.http.put<any>(`${this.apiUrl}/viviendas/${id}`, formData, { headers });
  }

  deleteVivienda(id: number): Observable<any> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
    return this.http.delete<any>(`${this.apiUrl}/viviendas/${id}`, { headers });
  }
}