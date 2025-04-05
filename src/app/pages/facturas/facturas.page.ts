import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  logoAngular, 
  homeOutline, 
  documentTextOutline, 
  chatbubbleOutline, 
  exitOutline, 
  notificationsOutline 
} from 'ionicons/icons';
import { 
  IonContent, 
  IonIcon, 
  IonItem, 
  IonList, 
  IonRefresher, 
  IonRefresherContent,
  IonSpinner,
  AlertController,
  LoadingController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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
    RouterModule,
    IonIcon,
    FormsModule,
    IonRefresher,
    IonRefresherContent,
    IonSpinner
  ]
})
export class FacturasPage implements OnInit {
  facturasPagadas: any[] = [];
  facturasPendientes: any[] = [];
  notificationCount: number = 0;
  isLoading = true;

  // Menú lateral dinámico
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/homepage-inquilinos' },
    { title: 'Facturas', icon: 'document-text-outline', active: true, route: '/facturas' },
    { title: 'Contáctanos', icon: 'chatbubble-outline', active: false, route: '/contactar-admin' },
    { title: 'Cerrar Sesión', icon: 'exit-outline', active: false, action: 'logout' }
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) { 
    addIcons({
      logoAngular,
      homeOutline,
      documentTextOutline,
      chatbubbleOutline,
      exitOutline,
      notificationsOutline
    });
  }

  ngOnInit() {
    this.reloadPage('Facturas'); // Forzar recarga si es necesario
    this.loadFacturas(); // Cargar los datos después de la recarga
  }

  // Función para recargar la página
  reloadPage(pageKey: string) {
    const hasReloaded = sessionStorage.getItem(`hasReloaded${pageKey}`);
    if (!hasReloaded) {
      sessionStorage.setItem(`hasReloaded${pageKey}`, 'true');
      window.location.reload();
    }
  }

  async loadFacturas(event?: any) {
    const token = localStorage.getItem('inquilinoToken');
    if (!token) {
      this.router.navigate(['/login-inquilinos']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/facturas/inquilino`, { headers }).subscribe({
      next: (facturas) => {
        console.log('Facturas recibidas del backend:', facturas);
        this.facturasPagadas = facturas.filter(factura => factura.estado === 'Pagada');
        this.facturasPendientes = facturas.filter(factura => factura.estado === 'Pendiente' || factura.estado === 'Atrasada');
        console.log('Facturas Pagadas:', this.facturasPagadas);
        console.log('Facturas Pendientes:', this.facturasPendientes);
        this.notificationCount = this.facturasPendientes.length;
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: async (err) => {
        this.isLoading = false;
        console.error('❌ Error al cargar facturas:', err);
        if (err.status === 401 || err.status === 403) {
          await this.showAlert('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('inquilinoToken');
          this.router.navigate(['/login-inquilinos']);
        } else {
          await this.showAlert('Error', 'Ocurrió un error al cargar las facturas. Intenta nuevamente.');
        }
        if (event) event.target.complete();
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  handleMenuClick(menu: any): void {
    if (menu.action) {
      switch (menu.action) {
        case 'logout':
          this.logout();
          break;
      }
    } else {
      // Limpiar la bandera de recarga para la página a la que se navega
      if (menu.route === '/homepage-inquilinos') {
        sessionStorage.removeItem('hasReloadedHomepage');
      } else if (menu.route === '/facturas') {
        sessionStorage.removeItem('hasReloadedFacturas');
      } else if (menu.route === '/contactar-admin') {
        sessionStorage.removeItem('hasReloadedContactarAdmin');
      }
      this.router.navigate([menu.route]);
    }
  }

  logout(): void {
    console.log('Cerrando sesión...');
    localStorage.removeItem('inquilinoToken');
    console.log('Token eliminado del localStorage');
    this.router.navigate(['/login-inquilinos']);
    console.log('Redirigido a /login-inquilinos');
  }

  refreshContent(event: any) {
    this.loadFacturas(event);
  }
}