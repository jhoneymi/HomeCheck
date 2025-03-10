import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { 
  addOutline, 
  alertCircleOutline, 
  businessOutline, 
  cashOutline, 
  documentsOutline, 
  documentTextOutline, 
  homeOutline, 
  logoAngular, 
  logoTwitter, 
  notificationsOutline, 
  peopleOutline, 
  storefrontOutline 
} from 'ionicons/icons';
import { 
  IonIcon,
  IonButton,
  IonItem, 
  IonContent, 
  IonList,
  IonModal,
  ModalController,
  AlertController
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { ViviendasService, Vivienda, ViviendaEdit } from 'src/app/services/viviendas.service';
import { ModalAgregarViviendaComponent } from 'src/app/modal-agregar-vivienda/modal-agregar-vivienda.component';
import { ModalEditarViviendaComponent } from 'src/app/modal-editar-vivienda/modal-editar-vivienda.component';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-viviendas',
  templateUrl: './viviendas.page.html',
  styleUrls: ['./viviendas.page.scss'],
  standalone: true,
  imports: [    
    IonContent,
    IonIcon,
    IonButton,
    IonItem, 
    IonList,
    IonModal,
    RouterModule,  
    CommonModule, 
    FormsModule,
    HttpClientModule,
    ModalAgregarViviendaComponent,
    ModalEditarViviendaComponent
  ]
})
export class ViviendasPage implements OnInit {
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '/facturas' },
    { title: 'Inquilinos', icon: 'people-outline', active: false, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: true, route: '/viviendas' },
    { title: 'Salida', icon: '', active: false, route: '' }
  ];

  viviendas: Vivienda[] = [];

  constructor(
    private viviendasService: ViviendasService,
    private modalController: ModalController,
    private authService: AuthService,
    private alertController: AlertController
  ) {    
    addIcons({
      cashOutline,
      logoAngular,
      homeOutline,
      documentTextOutline,
      peopleOutline,
      businessOutline,
      notificationsOutline,
      storefrontOutline,
      documentsOutline,
      alertCircleOutline,
      logoTwitter,
      addOutline
    });
  }

  ngOnInit() {
    this.getViviendas();
  }

  getViviendas() {
    this.viviendasService.getViviendas().subscribe({
      next: (viviendas) => {
        this.viviendas = viviendas;
        console.log('Viviendas cargadas desde la API:', viviendas);
      },
      error: (err) => {
        this.presentAlert('Error', 'Error al cargar las viviendas: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }

  async abrirModalAgregar() {
    const modal = await this.modalController.create({
      component: ModalAgregarViviendaComponent
    });
    modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm' && data) {
      this.viviendasService.addVivienda(data).subscribe({
        next: (response) => {
          console.log('Vivienda agregada:', response);
          this.presentAlert('Éxito', 'Vivienda agregada correctamente', [
            {
              text: 'Aceptar',
              handler: () => {
                this.getViviendas();
              }
            }
          ]);
        },
        error: (err) => {
          console.error('Error al agregar vivienda:', err);
          this.presentAlert('Error', 'Error al agregar vivienda: ' + (err.error?.error || 'Error desconocido'));
        }
      });
    }
  }

  async abrirModalEditar(vivienda: Vivienda) {
    console.log('Abriendo modal para editar vivienda:', vivienda);
    const modal = await this.modalController.create({
      component: ModalEditarViviendaComponent,
      componentProps: { vivienda }
    });
    modal.present();
  
    const { data, role } = await modal.onDidDismiss();
    console.log('Modal cerrado con role:', role, 'y data:', data);
    if (data) {
      console.log('Datos devueltos por el modal (detallado):', JSON.stringify(data, null, 2));
    }
    if (role === 'confirm' && data) {
      this.viviendasService.updateVivienda(vivienda.id, data as ViviendaEdit).subscribe({
        next: (response) => {
          console.log('Vivienda actualizada:', response);
          this.presentAlert('Éxito', 'Vivienda actualizada correctamente', [
            {
              text: 'Aceptar',
              handler: () => {
                this.getViviendas();
              }
            }
          ]);
        },
        error: (err) => {
          console.error('Error al actualizar vivienda:', err);
          const errorMessage = err.error?.error || err.error?.message || 'Error desconocido al actualizar la vivienda';
          this.presentAlert('Error', errorMessage);
        }
      });
    } else if (role === 'cancel') {
      console.log('Edición cancelada');
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Alquilada':
        return 'ocupada';
      case 'No Alquilada':
        return 'disponible';
      case 'En Remodelacion...':
        return 'mantenimiento';
      default:
        return '';
    }
  }

  getImageUrl(imagePath: string): string {
    return `${environment.apiUrl.replace('/api/auth', '')}/${imagePath}`;
  }

  async deleteVivienda(id: number) {
    const confirmed = await this.presentConfirmAlert();
    if (confirmed) {
      this.viviendasService.deleteVivienda(id).subscribe({
        next: (response) => {
          console.log('Vivienda eliminada:', response);
          this.presentAlert('Éxito', 'Vivienda eliminada correctamente', [
            {
              text: 'Aceptar',
              handler: () => {
                this.getViviendas();
              }
            }
          ]);
        },
        error: (err) => {
          console.error('Error al eliminar vivienda:', err);
          this.presentAlert('Error', 'Error al eliminar vivienda: ' + (err.error?.error || 'Error desconocido'));
        }
      });
    }
  }

  async mostrarNotas(notas: string) {
    const alert = await this.alertController.create({
      header: 'Notas de la Vivienda',
      message: notas || 'No hay notas disponibles.',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ],
      cssClass: 'custom-alert'
    });

    await alert.present();
  }

  async presentConfirmAlert(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Confirmación',
        message: '¿Estás seguro de eliminar esta vivienda?',
        buttons: [
          {
            text: 'No',
            role: 'cancel',
            handler: () => {
              resolve(false);
            }
          },
          {
            text: 'Sí',
            handler: () => {
              resolve(true);
            }
          }
        ],
        cssClass: 'custom-alert'
      });

      await alert.present();
    });
  }

  async presentAlert(header: string, message: string, buttons: any[] = [{ text: 'Aceptar', role: 'cancel' }]) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons,
      cssClass: 'custom-alert'
    });

    await alert.present();
  }
}