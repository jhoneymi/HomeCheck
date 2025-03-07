import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mailOutline, lockClosedOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { IonContent, IonButton, IonInput, IonItem, IonSpinner,IonIcon, LoadingController, AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonInput, IonItem, IonButton, IonSpinner,IonIcon,
    CommonModule, FormsModule
  ]
})
export class LoginPage {
  credentials = { email: '', password: '' };
  isLoading = false;

  constructor(
    public router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController // Agregamos AlertController para mostrar mensajes con estilo
  ) {addIcons({mailOutline,lockClosedOutline})}

  goToRegister() {
    this.router.navigate(['/register']);
  }

  // Método para mostrar una alerta estilizada
  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert' // Clase CSS personalizada para darle estilo
    });
    await alert.present();
  }

  async login() {
    if (!this.credentials.email.trim() || !this.credentials.password.trim()) {
      this.showAlert('⚠️ Campos vacíos', 'Por favor, ingrese su Email y Contraseña.');
      return;
    }

    // Validación del formato de email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(this.credentials.email)) {
      this.showAlert('⚠️ Email inválido', 'Por favor, ingrese un email válido.');
      return;
    }

    // Mostrar el indicador de carga
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    // Enviar los datos al backend
    this.http.post<{ token: string }>('http://localhost:3000/api/auth/login', this.credentials).subscribe({
      next: async (res) => {
        await loading.dismiss(); // Ocultar el spinner de carga

        if (res.token) {
          localStorage.setItem('authToken', res.token);
          this.router.navigate(['/home']); // Redirigir sin alertas molestas
        } else {
          this.showAlert('⚠️ Error', 'El servidor no devolvió un token válido.');
        }
      },
      error: async (err) => {
        await loading.dismiss(); // Ocultar el spinner de carga
        console.error('❌ Error en el login:', err);

        switch (err.status) {
          case 400:
            this.showAlert('❌ Credenciales incorrectas', 'El email o la contraseña no son correctos.');
            break;
          case 500:
            this.showAlert('⚠️ Error del servidor', 'Intenta nuevamente más tarde.');
            break;
          case 0:
            this.showAlert('🌐 Problema de conexión', 'No se pudo conectar con el servidor. Verifica tu internet.');
            break;
          default:
            this.showAlert('⚠️ Error inesperado', 'Algo salió mal. Intenta nuevamente.');
        }
      }
    });
  }
}