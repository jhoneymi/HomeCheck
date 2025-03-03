import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { alertCircleOutline, businessOutline, cashOutline, documentsOutline, documentTextOutline, homeOutline, logoAngular, logoTwitter, notificationsOutline, peopleOutline, storefrontOutline } from 'ionicons/icons';
import { 
  IonIcon,
  IonItem, 
  IonContent, 
  IonAvatar, 
  IonCol, 
  IonRow, 
  IonGrid, 
  IonList} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { InquilinosService } from 'src/app/services/inquilinos.service';

@Component({
  selector: 'app-inquilinos',
  templateUrl: './inquilinos.page.html',
  styleUrls: ['./inquilinos.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonIcon,
    IonItem, 
    IonAvatar, 
    IonCol, 
    IonRow,
    RouterModule,  
    CommonModule, 
    IonGrid, 
    FormsModule, 
    IonList,  ]
})
export class InquilinosPage implements OnInit {

  // Menú lateral dinámico
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '/facturas' },
    { title: 'Inquilinos', icon: 'people-outline', active: true, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' }
  ];
  
  inquilinos: any[] = []; // Lista de inquilinos vacía inicialmente

  constructor(private inquilinosService: InquilinosService) {    
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
    });}

  ngOnInit() 
  { 
    // Obtener los inquilinos al iniciar
    this.getInquilinos()
  }
  
  getInquilinos() {
    this.inquilinosService.getInquilinos().subscribe({
      next: (data) => {
        this.inquilinos = data;  // Asignar los datos obtenidos a la lista de inquilinos
      },
      error: (err) => {
        console.error('Error al obtener los inquilinos:', err);
        // Aquí podrías mostrar alguna alerta o mensaje en caso de error
      }
    });
  }
}