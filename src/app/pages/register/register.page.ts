import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonSelect, IonSelectOption, IonIcon, LoadingController, AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonSelect, IonSelectOption, IonIcon,
    CommonModule, FormsModule
  ]
})
export class RegisterPage {
  userData = {
    nombre_completo: '',
    direccion: '',
    email: '',
    numero_cedula: '',
    tipo_domicilio: 'Casa',
    password: '',
    telefono: '',
    fecha_registro: ''
  };

  isLoading = false;
  mostrarImagen = false;
  imagenDomicilio = '';

  constructor(
    public router: Router,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController // Para mostrar alertas estilizadas
  ) {}

  // Mostrar la imagen según el tipo de domicilio
  mostrarImagenDomicilio(event: any) {
    const tipoDomicilio = event.detail.value;
    this.mostrarImagen = true;

    switch (tipoDomicilio) {
      case 'Casa':
        this.imagenDomicilio = 'assets/icon/casaregistro.jpg';
        break;
      case 'Departamento':
        this.imagenDomicilio = 'assets/icon/departamento.jpg';
        break;
      case 'Residencia':
        this.imagenDomicilio = 'assets/icon/residencia.jpg';
        break;
      default:
        this.mostrarImagen = false;
    }
  }

  // Método para mostrar una alerta personalizada
  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  // Redirigir al login
  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Validación antes de hacer el registro
  async register() {
    if (!this.userData.nombre_completo || !this.userData.email || !this.userData.password || !this.userData.telefono) {
      this.showAlert('⚠️ Campos obligatorios', 'Por favor, completa todos los campos.');
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(this.userData.email)) {
      this.showAlert('⚠️ Email inválido', 'Por favor, ingrese un email válido.');
      return;
    }

    this.userData.fecha_registro = new Date().toISOString();

    // Mostrar indicador de carga
    this.isLoading = true;
    const loading = await this.loadingCtrl.create({
      message: 'Registrando usuario...',
      spinner: 'crescent'
    });
    await loading.present();

    // Enviar los datos al backend
    this.http.post('http://localhost:3000/api/auth/register', this.userData).subscribe({
      next: async () => {
        await loading.dismiss(); // Ocultar la carga
        this.router.navigate(['/login']); // Redirigir sin mostrar alerta
      },
      error: async (err) => {
        await loading.dismiss(); // Ocultar la carga
        console.error('❌ Error en el registro:', err);

        switch (err.status) {
          case 400:
            this.showAlert('❌ Error en los datos', 'Hay un problema con los datos ingresados.');
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