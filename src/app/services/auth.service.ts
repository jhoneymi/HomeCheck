import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators'; // Importar tap para manejar la respuesta
import { environment } from 'src/environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private userId: number | null = null;

  constructor(private http: HttpClient) {
    // Verificar si hay un token almacenado al iniciar el servicio
    const token = this.getToken();
    if (token) {
      this.setUserFromToken(token);
    }
  }

  // Registro de usuario
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Inicio de sesión
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.token) {
          this.saveToken(response.token); // Guardar y decodificar el token
        }
      })
    );
  }

  // Guardar token en LocalStorage y decodificarlo
  saveToken(token: string) {
    localStorage.setItem('authToken', token);
    this.setUserFromToken(token);
  }

  // Obtener token del LocalStorage
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Extraer el userId del token
  private setUserFromToken(token: string) {
    try {
      const decodedToken: any = jwtDecode(token);
      this.userId = decodedToken.userId;
    } catch (error) {
      console.error('Error decodificando el token:', error);
      this.userId = null;
    }
  }

  // Obtener el userId
  getUserId(): number | null {
    return this.userId;
  }

  // Cerrar sesión (eliminar token y userId)
  logout() {
    this.userId = null;
    localStorage.removeItem('authToken');
  }
}