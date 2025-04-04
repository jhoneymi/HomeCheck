import { Component, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
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
  exitOutline,
  cashOutline
} from 'ionicons/icons';
import { 
  IonContent, 
  IonSearchbar, 
  IonIcon, 
  IonItem, 
  IonList, 
  IonBadge, 
  IonRefresher, 
  IonRefresherContent 
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ganancias',
  templateUrl: './ganancias.page.html',
  styleUrls: ['./ganancias.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonIcon, 
    IonItem, 
    IonList,  
    RouterModule,
    CommonModule, 
    FormsModule,
  ]
})

export class GananciasPage implements OnInit {

  // Menú lateral dinámico
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '/facturas-admin' },
    { title: 'Inquilinos', icon: 'people-outline', active: false, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' },
    { title: 'Ganancias', icon: 'cash-outline', active: true, route: '/ganancias' },
    { title: 'Salir', icon: 'exit-outline', active: false, action: 'logout' }
  ];

  constructor(    
    private authService: AuthService, // Inyectar AuthService
    private router: Router // Inyectar Router 
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
      logoTwitter
    });
   }

   handleMenuClick(menu: any): void {
    if (menu.action) {
      // Ejecutar acción según el valor de 'action'
      switch (menu.action) {
        case 'logout':
          this.logout();
          break;
        // Agregar más acciones si las necesitas en el futuro
        default:
          break;
      }
    }
    // Si no hay acción, dejar que [routerLink] maneje la navegación
  }

  logout(): void {
    console.log('Cerrando sesión...');
    this.authService.logout(); // Limpia token y userId
    console.log('Token y UserId eliminados del localStorage');
    this.router.navigate(['/login']); // Redirige al login
    console.log('Redirigido a /login');
  }

  ngOnInit() {
  }

}
