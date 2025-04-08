import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';
import { IonicModule, ModalController, AlertController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  businessOutline,
  cashOutline,
  documentTextOutline,
  homeOutline,
  logoAngular,
  peopleOutline,
  exitOutline,
  pencilOutline,
  trashOutline,
} from 'ionicons/icons';
import { RouterModule, Router } from '@angular/router';
import { InquilinosService } from 'src/app/services/inquilinos.service';
import { ModalAgregarInquilinoComponent } from 'src/app/modal-agregar-inquilino/modal-agregar-inquilino.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-inquilinos',
  templateUrl: './inquilinos.page.html',
  styleUrls: ['./inquilinos.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
  ],
})
export class InquilinosPage implements OnInit {
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '/facturas-admin' },
    { title: 'Inquilinos', icon: 'people-outline', active: true, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' },
    { title: 'Ganancias', icon: 'cash-outline', active: false, route: '/ganancias' },
    { title: 'Salir', icon: 'exit-outline', active: false, action: 'logout' }
  ];

  inquilinos: any[] = [];
  filteredInquilinos: any[] = [];

  constructor(
    private inquilinosService: InquilinosService,
    private modalController: ModalController,
    private authService: AuthService,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private router: Router,
    private loadingCtrl: LoadingController
  ) {
    addIcons({
      logoAngular,
      homeOutline,
      documentTextOutline,
      peopleOutline,
      businessOutline,
      exitOutline,
      addOutline,
      pencilOutline,
      trashOutline,
      cashOutline,
    });
  }

  ngOnInit() {
    this.getInquilinos();
  }

  async getInquilinos() {
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
      message: 'Cargando inquilinos...',
      spinner: 'crescent',
    });
    await loading.present();

    this.http
      .get<any[]>(`http://localhost:3000/api/auth/inquilinos`, { headers })
      .subscribe({
        next: async (response) => {
          this.inquilinos = response;
          this.filteredInquilinos = [...this.inquilinos]; // Inicializamos filteredInquilinos
          console.log('Inquilinos cargados:', this.inquilinos);
          console.log('Filtered Inquilinos inicializados:', this.filteredInquilinos);
          await loading.dismiss();
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Error al obtener los inquilinos:', err);
          if (err.status === 403) {
            await this.showAlert('Error', 'No tienes permiso para ver los inquilinos. Verifica tu sesión o contacta al administrador.');
            localStorage.removeItem('authToken');
            this.router.navigate(['/login']);
          } else if (err.status === 401) {
            await this.showAlert('Error', 'Sesión inválida. Por favor, inicia sesión nuevamente.');
            localStorage.removeItem('authToken');
            this.router.navigate(['/login']);
          } else {
            await this.showAlert('Error', `Ocurrió un error al cargar los inquilinos: ${err.error?.error || 'Error desconocido'}`);
          }
        },
      });
  }

  onSearch(event: any) {
    const query = event.detail.value.toLowerCase();
    if (!query) {
      this.filteredInquilinos = [...this.inquilinos]; // Si no hay búsqueda, mostramos todos los inquilinos
    } else {
      this.filteredInquilinos = this.inquilinos.filter(
        (inquilino) =>
          inquilino.nombre.toLowerCase().includes(query) ||
          (inquilino.email && inquilino.email.toLowerCase().includes(query)) ||
          inquilino.telefono.toLowerCase().includes(query)
      );
    }
  }

  async abrirModal() {
    const modal = await this.modalController.create({
      component: ModalAgregarInquilinoComponent,
      cssClass: 'custom-modal',
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm') {
      this.getInquilinos();
    }
  }

  async abrirModalEditar(inquilino: any) {
    const modal = await this.modalController.create({
      component: ModalAgregarInquilinoComponent,
      componentProps: { inquilino, editMode: true },
      cssClass: 'custom-modal',
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm') {
      this.getInquilinos();
    }
  }

  async eliminarInquilino(id: number) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas eliminar este inquilino?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: () => {
            const headers = this.inquilinosService.getHeaders();
            this.inquilinosService.deleteInquilino(id, headers).subscribe({
              next: () => {
                this.getInquilinos();
                this.showAlert('Éxito', 'Inquilino eliminado correctamente.');
              },
              error: (err) => {
                console.error('Error al eliminar inquilino:', err);
                this.showAlert('Error', 'No se pudo eliminar el inquilino.');
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  viewProfile(inquilinoId: number) {
    this.router.navigate(['/inquilino-profile', inquilinoId]);
  }

  logout(): void {
    console.log('Cerrando sesión...');
    this.authService.logout(); // Limpia token y userId
    console.log('Token y UserId eliminados del localStorage');
    this.router.navigate(['/login']); // Redirige al login
    console.log('Redirigido a /login');
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