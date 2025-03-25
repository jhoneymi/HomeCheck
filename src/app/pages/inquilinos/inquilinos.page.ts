import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule, ModalController } from '@ionic/angular';
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
  storefrontOutline,
  exitOutline, 
  pencilOutline,
  trashOutline
} from 'ionicons/icons';
import { RouterModule } from '@angular/router';
import { InquilinosService } from 'src/app/services/inquilinos.service';
import { AuthService } from 'src/app/services/auth.service';
import { ModalAgregarInquilinoComponent } from 'src/app/modal-agregar-inquilino/modal-agregar-inquilino.component';

// Importar la interfaz ViviendasResponse desde InquilinosService o definirla aquí
interface ViviendasResponse {
  data?: any[]; // Array de viviendas (opcional)
  message?: string; // Mensaje opcional
}

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
    RouterModule
    // Eliminar ModalAgregarInquilinoComponent del imports, ya que se usa dinámicamente
  ]
})
export class InquilinosPage implements OnInit {
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '#' },
    { title: 'Inquilinos', icon: 'people-outline', active: true, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' },
    { title: 'Ganancias', icon: 'cash-outline', active: false, route: '#'},
    { title: 'Salida', icon: 'exit-outline', active: false, route: '' }
  ];

  inquilinos: any[] = [];
  viviendas: any[] = [];

  constructor(
    private inquilinosService: InquilinosService,
    private authService: AuthService,
    private modalController: ModalController
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
      exitOutline,
      alertCircleOutline,
      logoTwitter,
      addOutline,
      pencilOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.getInquilinos();
    this.getViviendas();
  }

  getInquilinos() {
    const headers = this.inquilinosService.getHeaders();
    this.inquilinosService.getInquilinos(headers).subscribe({
      next: (data) => this.inquilinos = data,
      error: (err) => console.error('Error al obtener los inquilinos:', err)
    });
  }

  getViviendas() {
    const headers = this.inquilinosService.getHeaders();
    this.inquilinosService.getViviendasDisponibles(headers).subscribe({
      next: (data: any[] | ViviendasResponse) => {
        console.log('Viviendas recibidas:', data);
        this.viviendas = Array.isArray(data) ? data : (data.data || []);
      },
      error: (err) => {
        console.error('Error al obtener las viviendas:', err);
      }
    });
  }

  getViviendaNombre(viviendaId: number | null): string {
    if (!viviendaId) return 'Sin asignar';
    const vivienda = this.viviendas.find(v => v.id === viviendaId);
    return vivienda ? vivienda.nombre : 'N/A';
  }

  getUltimoPagoFecha(fecha: string | null): string {
    return fecha ? (new Date(fecha).toLocaleDateString() || 'N/A') : 'N/A';
  }

  getMontoPendiente(monto: number | null): string {
    return monto !== null && monto !== undefined ? (monto.toFixed(2) || '0.00') : '0.00';
  }

  async abrirModal() {
    const modal = await this.modalController.create({
      component: ModalAgregarInquilinoComponent,
      cssClass: 'custom-modal'
    });
    modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm') {
      this.getInquilinos();
    }
  }

  async abrirModalEditar(inquilino: any) {
    const modal = await this.modalController.create({
      component: ModalAgregarInquilinoComponent,
      componentProps: { inquilino, editMode: true },
      cssClass: 'custom-modal'
    });
    modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm') {
      this.getInquilinos();
    }
  }

  eliminarInquilino(id: number) {
    const headers = this.inquilinosService.getHeaders();
    this.inquilinosService.deleteInquilino(id, headers).subscribe({
      next: () => this.getInquilinos(),
      error: (err) => console.error('Error al eliminar inquilino:', err)
    });
  }
}