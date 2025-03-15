import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { mailOutline, lockClosedOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { IonContent, IonButton, IonInput, IonItem, IonSpinner, IonIcon, LoadingController, AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login-inquilinos',
  templateUrl: './login-inquilinos.page.html',
  styleUrls: ['./login-inquilinos.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonInput, IonItem, IonButton, IonSpinner, IonIcon,
    CommonModule, FormsModule
  ]
})
export class LoginInquilinosPage {
  credentials = { nombre: '', documento: '' };
  isLoading = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    addIcons({ mailOutline, lockClosedOutline });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  async login() {
    console.log('Datos ingresados:', JSON.stringify(this.credentials));
    if (!this.credentials.nombre.trim() || !this.credentials.documento.trim()) {
      this.showAlert('⚠️ Campos vacíos', 'Por favor, ingrese su Nombre y Documento de Identidad.');
      return;
    }

    const documentoPattern = /^\d{3}-?\d{7}-?\d$/;
    console.log('Documento a validar:', this.credentials.documento, 'Cumple patrón?', documentoPattern.test(this.credentials.documento));
    if (!documentoPattern.test(this.credentials.documento)) {
      this.showAlert('⚠️ Documento inválido', 'Por favor, ingrese un documento válido (ejemplo: 402-1231123-0 o 40212311230).');
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    this.http.post<{ token: string, message?: string }>(`${environment.apiUrl}/inquilinos/login`, {
      nombre: this.credentials.nombre,
      documento: this.credentials.documento // Enviar el documento tal como se ingresó (con guiones)
    }).subscribe({
      next: async (res) => {
        await loading.dismiss();
        if (res.token) {
          localStorage.setItem('inquilinoToken', res.token);
          this.router.navigate(['/homepage-inquilinos']);
        } else {
          this.showAlert('⚠️ Error', res.message || 'El servidor no devolvió un token válido.');
        }
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('❌ Error en el login de inquilino:', JSON.stringify(err));
        switch (err.status) {
          case 400:
            this.showAlert('❌ Credenciales incorrectas', 'El nombre o documento no son correctos.');
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

  goToRegister() {
    this.router.navigate(['/register-inquilinos']);
  }
}