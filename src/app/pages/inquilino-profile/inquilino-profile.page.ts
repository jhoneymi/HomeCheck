import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IonicModule, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  logoAngular,
  homeOutline,
  documentTextOutline,
  peopleOutline,
  businessOutline,
  cashOutline,
  exitOutline,
  mailOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import { ModalEnviarMensajeComponent } from 'src/app/modal-enviar-mensaje/modal-enviar-mensaje.component';
import { ModalRegistrarPagoComponent } from 'src/app/modal-registrar-pago/modal-registrar-pago.component';

interface Inquilino {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  vivienda_id: number;
  direccion?: string;
  vivienda_nombre?: string;
  precio_alquiler?: number;
}

interface Mensaje {
  id: number;
  inquilino_id: number;
  admin_id: number;
  contenido: string;
  fecha: string;
  tipo: string;
  leido?: boolean;
}

interface Pago {
  id: number;
  inquilino_id: number;
  monto: number;
  fecha_pago: string;
  estado: string;
  metodo_pago: string;
}

@Component({
  selector: 'app-inquilino-profile',
  templateUrl: './inquilino-profile.page.html',
  styleUrls: ['./inquilino-profile.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
})
export class InquilinoProfilePage implements OnInit {
  inquilino: Inquilino = {} as Inquilino;
  mensajes: Mensaje[] = [];
  pagos: Pago[] = [];

  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '#' },
    { title: 'Inquilinos', icon: 'people-outline', active: true, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' },
    { title: 'Ganancias', icon: 'cash-outline', active: false, route: '#' },
    { title: 'Salida', icon: 'exit-outline', active: false, route: '/login' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private modalController: ModalController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController // Añadimos LoadingController para mostrar un indicador de carga
  ) {
    addIcons({
      logoAngular,
      homeOutline,
      documentTextOutline,
      peopleOutline,
      businessOutline,
      cashOutline,
      exitOutline,
      mailOutline,
      arrowBackOutline,
    });
  }

  ngOnInit() {
    const inquilinoId = this.route.snapshot.paramMap.get('id');
    if (inquilinoId) {
      this.loadInquilino(+inquilinoId);
      this.loadMensajes(+inquilinoId);
      this.loadPagos(+inquilinoId);
    } else {
      this.showAlert('Error', 'No se proporcionó un ID de inquilino válido.');
      this.router.navigate(['/inquilinos']);
    }
  }

  async loadInquilino(inquilinoId: number) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      await this.showAlert('Sesión Expirada', 'No se encontró un token. Por favor, inicia sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const loading = await this.loadingCtrl.create({
      message: 'Cargando perfil del inquilino...',
      spinner: 'crescent',
    });
    await loading.present();

    this.http
      .get<Inquilino>(`http://localhost:3000/api/auth/inquilinos/${inquilinoId}`, { headers })
      .subscribe({
        next: async (response) => {
          this.inquilino = response;
          console.log('Inquilino cargado:', this.inquilino);
          await loading.dismiss();
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Error al cargar el inquilino:', err);
          if (err.status === 404) {
            await this.showAlert('Error', 'Inquilino no encontrado.');
          } else if (err.status === 403) {
            await this.showAlert('Error', 'No tienes permiso para ver este inquilino.');
          } else {
            await this.showAlert('Error', 'Ocurrió un error al cargar el inquilino.');
          }
          this.router.navigate(['/inquilinos']);
        },
      });
  }

async loadMensajes(inquilinoId: number) {
  const token = localStorage.getItem('authToken');
  if (!token) {
    await this.showAlert('Sesión Expirada', 'No se encontró un token. Por favor, inicia sesión nuevamente.');
    this.router.navigate(['/login']);
    return;
  }

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
  });

  const loading = await this.loadingCtrl.create({
    message: 'Cargando mensajes...',
    spinner: 'crescent',
  });
  await loading.present();

  this.http
    .get<Mensaje[]>(`http://localhost:3000/api/auth/mensajes/inquilino/${inquilinoId}`, { headers })
    .subscribe({
      next: async (response) => {
        this.mensajes = response;
        console.log('Mensajes cargados:', this.mensajes);
        await loading.dismiss();
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error al cargar los mensajes:', err);
        if (err.status === 403) {
          await this.showAlert('Error', 'No tienes permiso para ver los mensajes de este inquilino.');
        } else if (err.status === 404) {
          this.mensajes = [];
          console.log('No se encontraron mensajes para este inquilino.');
        } else if (err.status === 500) {
          await this.showAlert(
            'Error',
            `Ocurrió un error en el servidor al cargar los mensajes: ${err.error?.details || 'Por favor, intenta de nuevo más tarde.'}`
          );
        } else {
          await this.showAlert('Error', `Ocurrió un error al cargar los mensajes: ${err.error?.error || 'Error desconocido'}`);
        }
      },
    });
}

  async loadPagos(inquilinoId: number) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      await this.showAlert('Sesión Expirada', 'No se encontró un token. Por favor, inicia sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const loading = await this.loadingCtrl.create({
      message: 'Cargando pagos...',
      spinner: 'crescent',
    });
    await loading.present();

    this.http
      .get<Pago[]>(`http://localhost:3000/api/auth/pagos/inquilino/${inquilinoId}`, { headers })
      .subscribe({
        next: async (response) => {
          this.pagos = response;
          console.log('Pagos cargados:', this.pagos);
          await loading.dismiss();
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Error al cargar los pagos:', err);
          if (err.status === 404) {
            this.pagos = []; // Si no hay pagos, simplemente dejamos el array vacío
            console.log('No se encontraron pagos para este inquilino.');
          } else if (err.status === 500) {
            await this.showAlert('Error', 'Ocurrió un error en el servidor al cargar los pagos. Por favor, intenta de nuevo más tarde.');
          } else {
            await this.showAlert('Error', 'Ocurrió un error al cargar los pagos.');
          }
        },
      });
  }

  async abrirModalEnviarMensaje() {
    if (!this.inquilino || !this.inquilino.id) {
      await this.showAlert('Error', 'No se pudo obtener el ID del inquilino. Asegúrate de que el perfil del inquilino se haya cargado correctamente.');
      return;
    }

    const routerOutlet = document.querySelector('ion-router-outlet');
    if (routerOutlet) {
      routerOutlet.setAttribute('inert', '');
      routerOutlet.setAttribute('aria-hidden', 'true');
    }

    const modal = await this.modalController.create({
      component: ModalEnviarMensajeComponent,
      componentProps: { inquilinoId: this.inquilino.id },
      cssClass: 'custom-modal',
    });

    modal.onDidDismiss().then(async (result) => {
      if (routerOutlet) {
        routerOutlet.removeAttribute('inert');
        routerOutlet.setAttribute('aria-hidden', 'false');
      }
      const enviarMensajeButton = document.querySelector('ion-button[color="primary"]') as HTMLElement;
      if (enviarMensajeButton) {
        enviarMensajeButton.focus();
      }
      if (result.role === 'confirm' && result.data?.enviado) {
        await this.loadMensajes(this.inquilino.id); // Recargar los mensajes después de enviar uno
      }
    });

    await modal.present();

    // Forzar la eliminación de aria-hidden del modal
    const modalElement = document.querySelector('ion-modal');
    if (modalElement) {
      modalElement.removeAttribute('aria-hidden');
      modalElement.setAttribute('aria-label', 'Enviar mensaje al inquilino');
    }

    // Mover el foco al primer elemento enfocable dentro del modal
    if (modalElement) {
      const firstFocusableElement = modalElement.querySelector('ion-textarea') as HTMLElement;
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }
  }

  async abrirModalRegistrarPago() {
    if (!this.inquilino.id) {
      await this.showAlert('Error', 'No se pudo determinar el ID del inquilino.');
      return;
    }
  
    const modal = await this.modalController.create({
      component: ModalRegistrarPagoComponent,
      componentProps: {
        inquilinoId: this.inquilino.id,
        viviendaId: this.inquilino.vivienda_id, // Pasamos vivienda_id directamente
      },
      cssClass: 'custom-modal',
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm') {
      await this.loadPagos(this.inquilino.id); // Recargar los pagos después de registrar uno nuevo
    }
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