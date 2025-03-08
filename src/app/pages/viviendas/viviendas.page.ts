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
  ModalController
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { ViviendasService, Vivienda } from 'src/app/services/viviendas.service';
import { ModalAgregarViviendaComponent } from 'src/app/modal-agregar-vivienda/modal-agregar-vivienda.component';
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
    ModalAgregarViviendaComponent
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
    private authService: AuthService
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
        console.error('Error al obtener las viviendas:', err);
        alert('Error al cargar las viviendas: ' + (err.error?.error || 'Error desconocido'));
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
          alert('Vivienda agregada correctamente');
          this.getViviendas(); // Actualizar la lista de viviendas
        },
        error: (err) => {
          console.error('Error al agregar vivienda:', err);
          alert('Error al agregar vivienda: ' + (err.error?.error || 'Error desconocido'));
        }
      });
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
}