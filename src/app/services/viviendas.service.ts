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
  img: string;
  id_adm: number;
  fecha_registro?: string;
  precio_alquiler: number;
  notas: string;
}

export interface ViviendaEdit {
  id: number;
  nombre?: string;
  direccion?: string;
  estado?: 'Alquilada' | 'No Alquilada' | 'En Remodelacion...';
  img?: string | File;
  id_adm?: number;
  precio_alquiler?: number;
  notas?: string;
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
    formData.append('precio_alquiler', vivienda.precio_alquiler.toString());
    formData.append('notas', vivienda.notas || '');

    return this.http.post<any>(`${this.apiUrl}/viviendas`, formData, { headers });
  }

  updateVivienda(id: number, vivienda: ViviendaEdit): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No se encontró un token de autenticación. Por favor, inicia sesión.');
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = new FormData();
  
    console.log('Preparando FormData con datos recibidos:', vivienda);
  
    // Solo incluir los campos que tienen valores
    if (vivienda.nombre) formData.append('nombre', vivienda.nombre);
    if (vivienda.direccion) formData.append('direccion', vivienda.direccion);
    if (vivienda.estado) formData.append('estado', vivienda.estado);
    if (vivienda.img instanceof File) {
      formData.append('img', vivienda.img); // Solo incluir si es un archivo
    }
    if (vivienda.id_adm) formData.append('id_adm', vivienda.id_adm.toString());
    if (vivienda.precio_alquiler) formData.append('precio_alquiler', vivienda.precio_alquiler.toString());
    if (vivienda.notas) formData.append('notas', vivienda.notas);
  
    const debugFormData: { [key: string]: any } = {};
    formData.forEach((value, key) => {
      debugFormData[key] = value;
    });
    console.log('Datos enviados al backend (FormData reconstruido):', debugFormData);
  
    return this.http.put<any>(`${this.apiUrl}/viviendas/${id}`, formData, { headers });
  }

  deleteVivienda(id: number): Observable<any> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
    return this.http.delete<any>(`${this.apiUrl}/viviendas/${id}`, { headers });
  }
}