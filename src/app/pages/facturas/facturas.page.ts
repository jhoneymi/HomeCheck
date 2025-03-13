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
  exitOutline,
  cashOutline
} from 'ionicons/icons';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service'; // Importar AuthService
import { Router } from '@angular/router'; // Importar Router

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
    IonIcon,
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
    { title: 'Ganancias', icon: 'cash-outline', active: false, route: '#' },
    { title: 'Salir', icon: 'exit-outline', active: false, action: 'logout' } // Cambiamos route por action
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
      alertCircleOutline,
      exitOutline,
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

  ngOnInit() {}
}