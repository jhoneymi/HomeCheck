import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton ,IonInput, IonItem} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonInput, IonItem, IonButton,
    CommonModule, FormsModule
  ]
})
export class LoginPage {
  credentials = { email: '', password: '' };

  constructor(public router: Router, private http: HttpClient) {}

  goToRegister() {
    this.router.navigate(['/register']);
  }

  login() {
    // Validación antes de hacer el login
    if (!this.credentials.email || !this.credentials.password) {
      alert('Por favor, ingrese ambos campos (Email y Contraseña).');
      return;
    }

    // Enviar los datos al backend
    this.http.post<{ token: string }>('http://localhost:3000/api/auth/login', this.credentials).subscribe({
      next: (res) => {
        // Verificar si la respuesta contiene el token
        if (res.token) {
          localStorage.setItem('authToken', res.token);
          alert('Login exitoso');
          this.router.navigate(['/home']);
        } else {
          alert('El servidor no devolvió un token válido');
        }
      },
      error: (err) => {
        console.error('Error en el login:', err);
        
        // Manejo de diferentes errores de la API
        if (err.status === 400) {
          alert('Credenciales incorrectas, por favor intenta nuevamente.');
        } else if (err.status === 500) {
          alert('Error en el servidor. Intenta nuevamente más tarde.');
        } else {
          alert('Hubo un error inesperado. Intenta nuevamente.');
        }
      }
    });
  }
}