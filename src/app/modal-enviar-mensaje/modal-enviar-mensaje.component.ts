import { Component, Input } from '@angular/core';
import { IonicModule, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-modal-enviar-mensaje',
  templateUrl: './modal-enviar-mensaje.component.html',
  styleUrls: ['./modal-enviar-mensaje.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ModalEnviarMensajeComponent {
  @Input() inquilinoId!: number;

  mensaje = {
    mensaje: '',
    tipo: 'texto', // Añadimos el campo tipo con un valor por defecto
  };

  constructor(
    private modalController: ModalController,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController // Añadimos LoadingController para mostrar un indicador de carga
  ) {}

  async cancelar() {
    await this.modalController.dismiss(null, 'cancel');
  }

  async enviarMensaje() {
    // Validar el mensaje
    if (!this.mensaje.mensaje || !this.mensaje.mensaje.trim()) {
      await this.showAlert('Error', 'El mensaje no puede estar vacío.');
      return;
    }

    // Validar el inquilinoId
    if (!this.inquilinoId || isNaN(this.inquilinoId)) {
      await this.showAlert('Error', 'ID de inquilino inválido.');
      return;
    }

    // Validar el tipo
    if (!this.mensaje.tipo || !this.mensaje.tipo.trim()) {
      await this.showAlert('Error', 'El tipo de mensaje no puede estar vacío.');
      return;
    }

    // Obtener el token
    const token = localStorage.getItem('authToken');
    if (!token) {
      await this.showAlert('Sesión Expirada', 'No se encontró un token. Por favor, inicia sesión nuevamente.');
      await this.modalController.dismiss(null, 'cancel');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Preparar los datos para enviar
    const mensajeData = {
      inquilino_id: this.inquilinoId,
      contenido: this.mensaje.mensaje.trim(),
      tipo: this.mensaje.tipo, // Incluimos el campo tipo
    };

    console.log('Enviando mensaje:', mensajeData);

    // Mostrar un indicador de carga
    const loading = await this.loadingCtrl.create({
      message: 'Enviando mensaje...',
      spinner: 'crescent',
    });
    await loading.present();

    // Enviar la solicitud
    this.http
      .post('http://localhost:3000/api/auth/mensajes', mensajeData, { headers })
      .subscribe({
        next: async () => {
          await loading.dismiss();
          await this.showAlert('Éxito', 'Mensaje enviado correctamente.');
          await this.modalController.dismiss({ enviado: true }, 'confirm'); // Pasamos un valor para indicar éxito
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Error al enviar mensaje:', err);
          console.log('Detalles del error:', err.error);

          // Manejo de errores más específico
          if (err.status === 403) {
            await this.showAlert('Error', 'No tienes permiso para enviar un mensaje a este inquilino.');
          } else if (err.status === 400) {
            await this.showAlert('Error', 'Datos inválidos. Asegúrate de que el mensaje y el tipo sean válidos.');
          } else if (err.status === 404) {
            await this.showAlert('Error', 'Inquilino o administrador no encontrado.');
          } else if (err.status === 500) {
            await this.showAlert('Error', 'Ocurrió un error en el servidor. Por favor, intenta de nuevo más tarde.');
          } else {
            await this.showAlert(
              'Error',
              `Ocurrió un error al enviar el mensaje: ${err.error?.error || 'Error desconocido'} - Detalles: ${
                err.error?.details || err.message
              }`
            );
          }
        },
      });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}