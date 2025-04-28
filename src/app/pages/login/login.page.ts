import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mailOutline, lockClosedOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { IonContent, IonButton, IonInput, IonSpinner, IonIcon, LoadingController, AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonInput, IonButton, IonSpinner, IonIcon,
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
    private alertCtrl: AlertController
  ) {
    addIcons({ mailOutline, lockClosedOutline });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert',
    });

    alert.onDidDismiss().then(() => {
      location.reload();
    });

    await alert.present();
  }

  async login() {
    if (!this.credentials.email.trim() || !this.credentials.password.trim()) {
      this.showAlert('⚠️ Campos vacíos', 'Por favor, ingrese su Email y Contraseña.');
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(this.credentials.email)) {
      this.showAlert('⚠️ Email inválido', 'Por favor, ingrese un email válido.');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    this.http.post('http://localhost:3000/api/auth/login', this.credentials).subscribe({
      next: async (res: any) => {
        await loading.dismiss();

        if (res.token) {
          localStorage.setItem('authToken', res.token);
          localStorage.setItem('userId', res.userId);

          // Verificar si role_id existe antes de usarlo
          if (res.role_id !== undefined) {
            localStorage.setItem('role_id', res.role_id.toString());

            // Redirigir según el role_id
            if (res.role_id === 1) {
              this.router.navigate(['/admin-home']);
            } else if (res.role_id === 2) {
              this.router.navigate(['/home']);
            } else {
              this.showAlert('⚠️ Error', 'Rol de usuario no reconocido.');
            }
          } else {
            this.showAlert('⚠️ Error', 'El servidor no devolvió un role_id válido.');
          }
        } else {
          this.showAlert('⚠️ Error', 'El servidor no devolvió un token válido.');
        }
      },
      error: async (err) => {
        await loading.dismiss();
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