import { Component, OnInit } from '@angular/core';
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
  cashOutline,
  addCircleOutline,
  trashOutline
} from 'ionicons/icons';
import { 
  IonContent, 
  IonIcon, 
  IonItem, 
  IonList, 
  IonBadge, 
  IonRefresher, 
  IonRefresherContent,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonModal,
  IonSpinner,
  IonDatetime,
  IonDatetimeButton
} from '@ionic/angular/standalone';
import { RouterModule } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertController, LoadingController } from '@ionic/angular';
import { jwtDecode } from 'jwt-decode';

interface Gasto {
  id: number;
  nombre: string;
  descripcion: string | null;
  monto: number;
  fecha_gasto: string;
  tipo: 'Mantenimiento' | 'Servicios' | 'Otros';
}

interface GananciaMensual {
  id?: number;
  mes: number;
  anio: number;
  ingresos: number;
  gastos: number;
  ganancia_neta: number;
}

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
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonModal,
    IonSpinner,
    IonDatetime,
    IonDatetimeButton,
    RouterModule,
    CommonModule, 
    FormsModule,
    IonBadge,
    IonRefresher,
    IonRefresherContent
  ]
})
export class GananciasPage implements OnInit {
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: false, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '/facturas-admin' },
    { title: 'Inquilinos', icon: 'people-outline', active: false, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' },
    { title: 'Ganancias', icon: 'cash-outline', active: true, route: '/ganancias' },
    { title: 'Salir', icon: 'exit-outline', active: false, action: 'logout' }
  ];

  token: string | null = null;
  adminId: number | null = null;
  isLoading = true;
  gananciasActual: GananciaMensual = { mes: 0, anio: 0, ingresos: 0, gastos: 0, ganancia_neta: 0 };
  gananciasHistoricas: GananciaMensual[] = [];
  gastos: Gasto[] = [];
  gastosPorCategoria: { [key: string]: number } = { Mantenimiento: 0, Servicios: 0, Otros: 0 };
  selectedMesAnio: string = '';
  filteredGanancias: GananciaMensual[] = [];
  today: string = new Date().toISOString().split('T')[0];
  hasSavedGanancias = false;

  // Formulario para agregar gasto
  isModalOpen = false;
  nuevoGasto: Gasto = {
    id: 0,
    nombre: '',
    descripcion: '',
    monto: 0,
    fecha_gasto: new Date().toISOString().split('T')[0],
    tipo: 'Mantenimiento'
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
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
      addCircleOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.token = localStorage.getItem('authToken');
    console.log('Token:', this.token);

    if (this.token) {
      try {
        const decodedToken: any = jwtDecode(this.token);
        this.adminId = decodedToken.userId;
        console.log('AdminId (desde token):', this.adminId);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        this.adminId = null;
      }
    } else {
      this.adminId = null;
    }

    if (!this.token || !this.adminId || this.adminId <= 0) {
      console.log('Redirigiendo al login: token no encontrado o adminId inválido');
      this.showAlert('Error', 'Sesión no encontrada. Por favor, inicia sesión nuevamente.').then(() => {
        this.router.navigate(['/login']);
      });
      return;
    }

    this.hasSavedGanancias = false;
    this.loadGanancias();
    this.loadGastos();
  }

  async loadGanancias() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });
    const today = new Date();
    this.selectedMesAnio = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
    const loading = await this.loadingCtrl.create({ message: 'Cargando ganancias...' });
    await loading.present();
  
    this.http.get<any>('http://localhost:3000/api/auth/ganancias/actual', { headers }).subscribe({
      next: (response) => {
        console.log('Respuesta de /ganancias/actual:', response);
        this.gananciasActual = {
          mes: response.mes,
          anio: response.anio,
          ingresos: response.ingresos,
          gastos: response.gastos,
          ganancia_neta: response.ganancia_neta
        };
        console.log('Ganancias actuales asignadas:', this.gananciasActual);
        const today = new Date();
        const isMonthEnded = today.getMonth() + 1 !== response.mes || today.getFullYear() !== response.anio;
        const shouldSave = (response.todos_pagaron || isMonthEnded) && !this.hasSavedGanancias;
  
        const alreadySaved = this.gananciasHistoricas.some(
          g => g.mes === response.mes && g.anio === response.anio
        );
  
        if (shouldSave && !alreadySaved) {
          this.hasSavedGanancias = true;
          this.guardarGananciasMes();
        }
      },
      error: async (error) => {
        console.error('Error al cargar ganancias actuales:', error);
        if (error.status === 401 || error.status === 403) {
          await this.showAlert('Error de Autenticación', 'Sesión inválida. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('authToken');
          this.router.navigate(['/login']);
        } else {
          await this.showAlert('Error', 'No se pudieron cargar las ganancias actuales: ' + (error.error?.message || error.message));
        }
      }
    });
  
    this.http.get<GananciaMensual[]>('http://localhost:3000/api/auth/ganancias/historico', { headers }).subscribe({
      next: (response) => {
        this.gananciasHistoricas = response;
        this.filterGanancias();
        this.isLoading = false;
        loading.dismiss();
      },
      error: async (error) => {
        console.error('Error al cargar ganancias históricas:', error);
        if (error.status === 401 || error.status === 403) {
          await this.showAlert('Error de Autenticación', 'Sesión inválida. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('authToken');
          this.router.navigate(['/login']);
        } else {
          await this.showAlert('Error', 'No se pudieron cargar las ganancias históricas: ' + (error.error?.message || error.message));
        }
        this.isLoading = false;
        loading.dismiss();
      }
    });
  }

  async loadGastos() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });
    this.http.get<Gasto[]>('http://localhost:3000/api/auth/gastos', { headers }).subscribe({
      next: (response) => {
        this.gastos = response;
        this.calcularGastosPorCategoria();
      },
      error: async (error) => {
        console.error('Error al cargar gastos:', error);
        if (error.status === 401 || error.status === 403) {
          await this.showAlert('Error de Autenticación', 'Sesión inválida. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('authToken');
          this.router.navigate(['/login']);
        } else {
          await this.showAlert('Error', 'No se pudieron cargar los gastos: ' + (error.error?.message || error.message));
        }
      }
    });
  }

  calcularGastosPorCategoria() {
    this.gastosPorCategoria = { Mantenimiento: 0, Servicios: 0, Otros: 0 };
    this.gastos.forEach(gasto => {
      this.gastosPorCategoria[gasto.tipo] += gasto.monto;
    });
  }

  filterGanancias() {
    if (!this.selectedMesAnio) {
      this.filteredGanancias = [...this.gananciasHistoricas];
      return;
    }
    const [anio, mes] = this.selectedMesAnio.split('-').map(Number);
    this.filteredGanancias = this.gananciasHistoricas.filter(g => g.mes === mes && g.anio === anio);
  }

  async guardarGananciasMes() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });
    const body = {
      mes: this.gananciasActual.mes,
      anio: this.gananciasActual.anio,
      ingresos: this.gananciasActual.ingresos,
      gastos: this.gananciasActual.gastos,
      ganancia_neta: this.gananciasActual.ganancia_neta
    };
    this.http.post('http://localhost:3000/api/auth/ganancias/guardar', body, { headers }).subscribe({
      next: () => {
        console.log('Ganancias del mes guardadas');
        const existingGanancia = this.gananciasHistoricas.find(
          g => g.mes === this.gananciasActual.mes && g.anio === this.gananciasActual.anio
        );
        if (!existingGanancia) {
          this.gananciasHistoricas.push({ ...this.gananciasActual });
          this.filterGanancias();
        }
      },
      error: (error) => {
        console.error('Error al guardar ganancias:', error);
        this.showAlert('Error', 'No se pudieron guardar las ganancias del mes');
        this.hasSavedGanancias = false;
      }
    });
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetForm();
  }

  resetForm() {
    this.nuevoGasto = {
      id: 0,
      nombre: '',
      descripcion: '',
      monto: 0,
      fecha_gasto: new Date().toISOString().split('T')[0],
      tipo: 'Mantenimiento'
    };
  }

  async agregarGasto() {
    if (!this.nuevoGasto.nombre || !this.nuevoGasto.monto || !this.nuevoGasto.fecha_gasto || !this.nuevoGasto.tipo) {
      await this.showAlert('Error', 'Por favor, completa todos los campos requeridos');
      return;
    }

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });
    const body = { ...this.nuevoGasto };
    this.http.post('http://localhost:3000/api/auth/gastos', body, { headers }).subscribe({
      next: () => {
        this.showAlert('Éxito', 'Gasto agregado exitosamente');
        this.closeModal();
        this.loadGastos();
        this.loadGanancias();
      },
      error: (error) => {
        console.error('Error al agregar gasto:', error);
        this.showAlert('Error', 'No se pudo agregar el gasto');
      }
    });
  }

  async eliminarGasto(gastoId: number) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: '¿Estás seguro de que deseas eliminar este gasto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            const headers = new HttpHeaders({ 'Authorization': `Bearer ${this.token}` });
            this.http.delete(`http://localhost:3000/api/auth/gastos/${gastoId}`, { headers }).subscribe({
              next: () => {
                this.showAlert('Éxito', 'Gasto eliminado exitosamente');
                this.loadGastos();
                this.loadGanancias();
              },
              error: (error) => {
                console.error('Error al eliminar gasto:', error);
                this.showAlert('Error', 'No se pudo eliminar el gasto');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
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
    this.authService.logout();
    console.log('Token y UserId eliminados del localStorage');
    this.router.navigate(['/login']);
    console.log('Redirigido a /login');
  }
}