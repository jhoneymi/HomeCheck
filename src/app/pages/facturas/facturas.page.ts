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
  IonBadge, 
  IonRefresher, 
  IonRefresherContent,
  IonLabel,
  IonSpinner,
  AlertController,
  LoadingController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { FacturasService } from 'src/app/services/facturas.service';

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
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonLabel,
    IonSpinner
  ]
})
export class FacturasPage implements OnInit {
  facturas: any[] = [];
  notificationCount: number = 0;
  isLoading = true;

  // Menú lateral dinámico (ajustado con rutas de HomepageInquilinosPage)
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/homepage-inquilinos' },
    { title: 'Facturas', icon: 'document-text-outline', active: true, route: '/facturas' },
    { title: 'Contáctanos', icon: 'chatbubble-outline', active: false, route: '/contactar-admin' },
    { title: 'Cerrar Sesión', icon: 'exit-outline', active: false, action: 'logout' }
  ];

  constructor(
    private router: Router,
    private facturasService: FacturasService,
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
    this.loadFacturas();
  }

  async loadFacturas(event?: any) {
    const token = localStorage.getItem('inquilinoToken');
    if (!token) {
      this.router.navigate(['/login-inquilinos']);
      return;
    }

    this.isLoading = true;
    this.facturasService.getFacturasInquilino().subscribe({
      next: (res) => {
        this.facturas = res.map((factura: any) => {
          const pagos: any[] = factura.pagos || [];
          const totalPagado = pagos.reduce((sum: number, pago: any) => sum + (pago.monto || 0), 0);
          factura.estado = totalPagado >= (factura.monto || 0) ? 'Pagada' : 'Pendiente';
          if (factura.estado === 'Pendiente' && new Date() > new Date(factura.fecha_vencimiento)) {
            factura.estado = 'Atrasada';
          }
          return factura;
        });
        this.notificationCount = this.facturas.filter((f: any) => f.estado === 'Pendiente' || f.estado === 'Atrasada').length;
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Error al cargar facturas:', err);
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('inquilinoToken');
          this.router.navigate(['/login-inquilinos']);
        }
        if (event) event.target.complete();
      }
    });
  }

  handleMenuClick(menu: any): void {
    if (menu.action) {
      switch (menu.action) {
        case 'logout':
          this.logout();
          break;
      }
    } else {
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