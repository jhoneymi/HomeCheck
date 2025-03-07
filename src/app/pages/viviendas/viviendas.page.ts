import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { addOutline, alertCircleOutline, businessOutline, cashOutline, documentsOutline, documentTextOutline, homeOutline, logoAngular, logoTwitter, notificationsOutline, peopleOutline, storefrontOutline } from 'ionicons/icons';
import {   
  IonIcon,
  IonButton,
  IonItem, 
  IonContent, 
  IonList } from '@ionic/angular/standalone';
  import { RouterModule } from '@angular/router';

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
    RouterModule,  
    CommonModule, 
    FormsModule, 
    IonList,]
})
export class ViviendasPage implements OnInit {

    // Menú lateral dinámico
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '/facturas' },
    { title: 'Inquilinos', icon: 'people-outline', active: false, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: true, route: '/viviendas' },
    { title: 'Salida', icon: '', active: false, route: '' }
  ];

  vivienda = {
    imagenUrl: 'https://source.unsplash.com/400x250/?house'
  };

  constructor() 
  { 
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
  }

}
