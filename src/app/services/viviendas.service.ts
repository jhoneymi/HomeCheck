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
}

@Injectable({
  providedIn: 'root'
})
export class ViviendasService {
  private apiUrl = environment.apiUrl; // Obtener la URL desde environment

  constructor(
    private http: HttpClient,
    private authService: AuthService // Inyectar AuthService
  ) {}

  // READ: Obtener todas las viviendas
  getViviendas(): Observable<Vivienda[]> {
    const token = this.authService.getToken();
    const headers = token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
    return this.http.get<Vivienda[]>(`${this.apiUrl}/viviendas`, { headers });
  }

  // CREATE: Agregar una nueva vivienda
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
    formData.append('img', vivienda.img); // El archivo de imagen
    formData.append('id_adm', vivienda.id_adm.toString());

    return this.http.post<any>(`${this.apiUrl}/viviendas`, formData, { headers });
  }
}