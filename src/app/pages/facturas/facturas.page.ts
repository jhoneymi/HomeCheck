import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { IonContent, IonList, IonItem, IonIcon } from '@ionic/angular/standalone'; // Agrega IonIcon
import { 
  homeOutline, 
  documentTextOutline, 
  peopleOutline, 
  businessOutline, 
  logoAngular, 
  notificationsOutline, 
  storefrontOutline, 
  documentsOutline, 
  alertCircleOutline, 
  logoTwitter, 
  cashOutline
} from 'ionicons/icons';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-facturas',
  templateUrl: './facturas.page.html',
  styleUrls: ['./facturas.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    IonList,
    IonItem,
    RouterLink,
    IonIcon, // Agrega IonIcon aquí
    FormsModule
  ]
})
export class FacturasPage implements OnInit {
  // Menú lateral dinámico
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: true, route: '/facturas' },
    { title: 'Inquilinos', icon: 'people-outline', active: false, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' },
    { title: 'Ganancias', icon: 'business-outline', active: false, route: '/ganancias' },
    { title: 'Salir', icon: 'business-outline', active: false, route: '/Salir' }
  ];

  constructor() { 
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
      logoTwitter
    });
  }

  ngOnInit() {}
}