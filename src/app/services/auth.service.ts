import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Registro de usuario
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Inicio de sesión
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // Guardar token en LocalStorage
  saveToken(token: string) {
    localStorage.setItem('authToken', token);
  }

  // Obtener token del LocalStorage
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Cerrar sesión (eliminar token)
  logout() {
    localStorage.removeItem('authToken');
  }
}