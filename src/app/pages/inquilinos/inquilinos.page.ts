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
  storefrontOutline 
} from 'ionicons/icons';
import { RouterModule } from '@angular/router';
import { InquilinosService } from 'src/app/services/inquilinos.service';
import { ModalAgregarInquilinoComponent } from 'src/app/modal-agregar-inquilino/modal-agregar-inquilino.component';

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
    ModalAgregarInquilinoComponent
  ]
})
export class InquilinosPage implements OnInit {
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '/facturas' },
    { title: 'Inquilinos', icon: 'people-outline', active: true, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' },
    { title: 'Salida', icon: '', active: false, route: '' }
  ];

  inquilinos: any[] = [];
  isModalOpen = false;

  constructor(
    private inquilinosService: InquilinosService,
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
      alertCircleOutline,
      logoTwitter,
      addOutline
    });
  }

  ngOnInit() {
    this.getInquilinos();
  }

  getInquilinos() {
    this.inquilinosService.getInquilinos().subscribe({
      next: (data) => this.inquilinos = data,
      error: (err) => console.error('Error al obtener los inquilinos:', err)
    });
  }

  async abrirModal() {
    const modal = await this.modalController.create({
      component: ModalAgregarInquilinoComponent,
      cssClass: 'custom-modal'
    });
    modal.present();

    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm') {
      console.log('Datos guardados:', data);
      this.getInquilinos(); // Refresca la lista si se guarda
    }
  }

  cerrarModal(event?: any) {
    console.log('Cerrando modal, evento:', event);
    this.modalController.dismiss();
  }
}