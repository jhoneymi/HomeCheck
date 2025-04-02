import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-modal-registrar-pago',
  templateUrl: './modal-registrar-pago.component.html',
  styleUrls: ['./modal-registrar-pago.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class ModalRegistrarPagoComponent implements OnInit {
  @Input() inquilinoId!: number;
  @Input() viviendaId?: number; // Opcional: Pasar vivienda_id directamente desde InquilinoProfilePage

  pago = {
    monto: 0,
    estado: 'Pendiente',
    metodo_pago: 'Efectivo',
    fecha_pago: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD para ion-datetime
    vivienda_id: '', // Lo inicializamos como vacío, pero lo asignaremos después
  };

  isLoading = false; // Estado de carga para deshabilitar el botón mientras se cargan los datos

  constructor(
    private modalController: ModalController,
    private http: HttpClient,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    if (!this.inquilinoId) {
      console.error('inquilinoId no está definido');
      this.showAlert('Error', 'No se proporcionó un ID de inquilino válido.');
      this.modalController.dismiss(null, 'cancel');
      return;
    }

    // Si viviendaId se pasa como @Input, lo usamos directamente
    if (this.viviendaId) {
      this.pago.vivienda_id = this.viviendaId.toString();
    } else {
      // Si no se pasa viviendaId, lo cargamos desde el backend
      this.loadInquilino();
    }
  }

  loadInquilino() {
    const token = localStorage.getItem('authToken'); // Asegúrate de que el nombre de la clave sea correcto
    if (!token) {
      console.error('No se encontró un token');
      this.showAlert('Sesión Expirada', 'No se encontró un token. Por favor, inicia sesión nuevamente.');
      this.modalController.dismiss(null, 'cancel');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.isLoading = true;

    this.http
      .get<any>(`http://localhost:3000/api/auth/inquilinos/${this.inquilinoId}`, { headers })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.vivienda_id) {
            this.pago.vivienda_id = response.vivienda_id.toString();
          } else {
            console.error('El inquilino no tiene una vivienda asignada');
            this.showAlert(
              'Error',
              'El inquilino no tiene una vivienda asignada. No se puede registrar el pago.'
            );
            this.modalController.dismiss(null, 'cancel');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al cargar el inquilino:', err);
          this.showAlert('Error', 'Ocurrió un error al cargar los datos del inquilino.');
          this.modalController.dismiss(null, 'cancel');
        },
      });
  }

  cancelar() {
    this.modalController.dismiss(null, 'cancel');
  }

  registrarPago() {
    const token = localStorage.getItem('authToken'); // Asegúrate de que el nombre de la clave sea correcto
    if (!token) {
      this.showAlert('Sesión Expirada', 'No se encontró un token. Por favor, inicia sesión nuevamente.');
      this.modalController.dismiss(null, 'cancel');
      return;
    }

    // Validar los datos antes de enviarlos
    if (!this.pago.vivienda_id) {
      this.showAlert('Error', 'No se puede registrar el pago porque el inquilino no tiene una vivienda asignada.');
      return;
    }

    if (this.pago.monto <= 0) {
      this.showAlert('Error', 'El monto debe ser mayor que 0.');
      return;
    }

    if (!this.pago.fecha_pago) {
      this.showAlert('Error', 'Por favor, seleccione una fecha de pago.');
      return;
    }

    if (!this.pago.metodo_pago) {
      this.showAlert('Error', 'Por favor, seleccione un método de pago.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Formatear la fecha para MySQL (YYYY-MM-DD HH:mm:ss)
    const fechaPago = new Date(this.pago.fecha_pago).toISOString().slice(0, 19).replace('T', ' ');

    const pagoData = {
      inquilino_id: this.inquilinoId,
      vivienda_id: parseInt(this.pago.vivienda_id, 10), // Convertimos a número
      monto: this.pago.monto,
      metodo_pago: this.pago.metodo_pago,
      fecha_pago: fechaPago,
      estado: this.pago.estado,
    };

    this.isLoading = true;

    this.http
      .post('http://localhost:3000/api/auth/pagos/admin', pagoData, { headers })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.showAlert('Éxito', 'Pago registrado correctamente.');
          this.modalController.dismiss(null, 'confirm');
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al registrar pago:', err);
          this.showAlert('Error', 'Ocurrió un error al registrar el pago: ' + (err.error?.error || 'Error desconocido'));
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