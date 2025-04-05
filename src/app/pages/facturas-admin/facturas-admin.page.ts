import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  homeOutline, 
  documentTextOutline, 
  peopleOutline, 
  businessOutline, 
  logoAngular, 
  notificationsOutline, 
  cashOutline,
  exitOutline
} from 'ionicons/icons';
import { 
  IonContent, 
  IonSearchbar, 
  IonIcon, 
  IonItem, 
  IonList, 
  IonBadge, 
  IonRefresher, 
  IonRefresherContent,
  IonButton,
  AlertController,
  LoadingController,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonInput, // Importar IonInput explícitamente
  IonSpinner
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

interface Factura {
  id: string;
  inquilino_id: number;
  inquilino_nombre: string;
  vivienda: string;
  montoTotal: number;
  fechaEmision: string;
  fechaVencimiento: string;
  estado: string;
  pagos: { id: string; monto: number; fecha_pago: string; metodo_pago: string; estado: string }[];
  montoPendiente: number;
  montoDevuelto: number;
}

interface Ganancias {
  pagadas: number;
  pendientes: number;
  total: number;
}

interface ApiResponse {
  facturas: Factura[];
  ganancias: Ganancias;
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-facturas-admin',
  templateUrl: './facturas-admin.page.html',
  styleUrls: ['./facturas-admin.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonSearchbar, 
    IonIcon, 
    IonItem, 
    IonList, 
    IonBadge, 
    IonRefresher, 
    IonRefresherContent,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonInput, // Añadir IonInput a las importaciones
    IonSpinner,
    RouterModule,
    CommonModule, 
    FormsModule
  ]
})
export class FacturasAdminPage implements OnInit, AfterViewInit {
  @ViewChild('searchBar') searchBar!: ElementRef;

  facturas: Factura[] = [];
  filteredFacturas: Factura[] = [];
  ganancias: Ganancias = { pagadas: 0, pendientes: 0, total: 0 };
  isLoading = true;
  searchQuery: string = '';
  sortOrder: 'asc' | 'desc' = 'desc';
  fechaInicio: string | null = null;
  fechaFin: string | null = null;
  adminId: number | null = null;
  token: string | null = null;

  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: true, route: '/facturas-admin' },
    { title: 'Inquilinos', icon: 'people-outline', active: false, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' },
    { title: 'Ganancias', icon: 'cash-outline', active: false, route: '/ganancias' },
    { title: 'Salir', icon: 'exit-outline', active: false, action: 'logout' }
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
      peopleOutline,
      businessOutline,
      notificationsOutline,
      cashOutline,
      exitOutline
    });
  }

  ngOnInit() {
    this.token = localStorage.getItem('authToken');
    this.adminId = localStorage.getItem('adminId') ? parseInt(localStorage.getItem('adminId')!, 10) : null;
    if (!this.token) {
      this.showAlert('Sesión Expirada', 'No se encontró un token. Por favor, inicia sesión nuevamente.');
      this.router.navigate(['/login']);
      return;
    }
    console.log('Token enviado:', this.token);
    this.loadFacturas();
  }

  ngAfterViewInit() {
    if (this.searchBar && this.searchBar.nativeElement) {
      this.searchBar.nativeElement.focus();
    } else {
      console.warn('Elemento searchBar no encontrado');
    }
  }

  async loadFacturas() {
    if (!this.token) return;
  
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
    console.log('Headers configurados:', headers);
  
    let params = new HttpParams()
      .set('sort', this.sortOrder);
    if (this.fechaInicio) params = params.set('fechaInicio', this.fechaInicio);
    if (this.fechaFin) params = params.set('fechaFin', this.fechaFin);
  
    const loading = await this.loadingCtrl.create({
      message: 'Cargando facturas...',
      spinner: 'crescent',
    });
    await loading.present();
  
    this.http.get<ApiResponse>('http://localhost:3000/api/auth/facturas', {
      headers,
      params,
      observe: 'body',
      responseType: 'json'
    }).subscribe({
      next: async (response) => {
        console.log('Respuesta del backend:', response);
        if (response.success) {
          this.facturas = response.facturas || [];
          this.ganancias = response.ganancias || { pagadas: 0, pendientes: 0, total: 0 };
          this.filterAndSortFacturas(); // Filtra y ordena después de cargar
        } else {
          await this.showAlert('Error', response.message || 'Error al cargar las facturas');
        }
        this.isLoading = false;
        await loading.dismiss();
      },
      error: async (err) => {
        this.isLoading = false;
        await loading.dismiss();
        console.error('Error HTTP:', err);
        if (err.status === 401) {
          await this.showAlert('Error', 'Sesión inválida. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('authToken');
          this.router.navigate(['/login']);
        } else if (err.status === 403) {
          await this.showAlert('Error', 'Token inválido. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('authToken');
          this.router.navigate(['/login']);
        } else {
          await this.showAlert('Error', `Ocurrió un error al cargar las facturas: ${err.error?.message || err.message || 'Error desconocido'}`);
        }
      }
    });
  }

  filterAndSortFacturas() {
    let filtered = [...this.facturas];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(factura =>
        factura.inquilino_nombre.toLowerCase().includes(query) ||
        factura.vivienda.toLowerCase().includes(query)
      );
    }

    if (this.fechaInicio || this.fechaFin) {
      const startDate = this.fechaInicio ? new Date(this.fechaInicio) : null;
      const endDate = this.fechaFin ? new Date(this.fechaFin) : null;
      filtered = filtered.filter(factura => {
        const fechaEmision = new Date(factura.fechaEmision);
        return (!startDate || !isNaN(startDate.getTime()) && fechaEmision >= startDate) &&
               (!endDate || !isNaN(endDate.getTime()) && fechaEmision <= endDate);
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.fechaEmision).getTime();
      const dateB = new Date(b.fechaEmision).getTime();
      return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    this.filteredFacturas = filtered;
  }

  onSearch(event: any) {
    this.searchQuery = event.detail.value || '';
    this.filterAndSortFacturas(); // Filtra localmente en lugar de recargar
  }

  onSortChange(event: any) {
    this.sortOrder = event.detail.value;
    this.loadFacturas();
  }

  onFechaInicioChange(event: any) {
    this.fechaInicio = event.detail.value || null;
    this.loadFacturas();
  }

  onFechaFinChange(event: any) {
    this.fechaFin = event.detail.value || null;
    this.loadFacturas();
  }

  handleMenuClick(menu: any): void {
    if (menu.action) {
      switch (menu.action) {
        case 'logout':
          this.logout();
          break;
        default:
          break;
      }
    }
  }

  logout(): void {
    console.log('Cerrando sesión...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminId');
    console.log('Token y adminId eliminados del localStorage');
    this.router.navigate(['/login']);
    console.log('Redirigido a /login');
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  refreshContent(event: any) {
    this.loadFacturas();
    event.target.complete();
  }

  viewFacturaDetails(factura: Factura) {
    console.log('Ver detalles de factura:', factura);
    // Ejemplo: this.router.navigate(['/factura-detalle', factura.id]);
  }
}