import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
  notificationsOutline, 
  cashOutline, 
  cardOutline, 
  walletOutline, 
  calendarOutline
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
  LoadingController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import Chart from 'chart.js/auto';
import { lastValueFrom } from 'rxjs';

// Definir interfaces para tipado
interface Pago {
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
}

interface Factura {
  id: number;
  inquilino_id: number;
  monto: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: string;
  pagos: Pago[];
}

@Component({
  selector: 'app-homepage-inquilinos',
  templateUrl: './homepage-inquilinos.page.html',
  styleUrls: ['./homepage-inquilinos.page.scss'],
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
    RouterModule,
    CommonModule, 
    FormsModule
  ]
})
export class HomepageInquilinosPage implements OnInit, AfterViewInit {
  @ViewChild('paymentsChart') paymentsChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pendingChart') pendingChart!: ElementRef<HTMLCanvasElement>;

  inquilino: any = {};
  vivienda: any = {};
  notificationCount: number = 0;
  isLoading = true;
  nextPaymentDate: string | null = null;
  paymentHistory: Pago[] = [];
  charts: Chart[] = []; // Tipamos charts como un arreglo de instancias de Chart

  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: true, route: '/homepage-inquilinos' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '/facturas' },
    { title: 'Contáctanos', icon: 'chatbubble-outline', active: false, route: '/contactar-admin' },
    { title: 'Cerrar Sesión', icon: 'exit-outline', active: false, action: 'logout' }
  ];

  cards: any[] = [];

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
      notificationsOutline,
      cashOutline,
      cardOutline,
      walletOutline,
      calendarOutline
    });
  }

  ngOnInit() {
    this.loadInquilinoData();
  }

  ngAfterViewInit() {
    this.updateCharts();
  }

  ngOnDestroy() {
    this.charts.forEach(chart => chart.destroy());
  }

  async loadInquilinoData(event?: any) {
    const token = localStorage.getItem('inquilinoToken');
    if (!token) {
      this.router.navigate(['/login-inquilinos']);
      return;
    }

    console.log (token)
  
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    this.isLoading = true;
    this.http.get<any>(`${environment.apiUrl}/inquilinos/me`, { headers }).subscribe({
      next: (res) => {
        console.log('Datos recibidos del backend:', res);
        this.inquilino = res.inquilino || {};
        this.vivienda = res.vivienda || {};
        this.notificationCount = this.calculatePendingNotifications();
  
        this.calculateNextPayment();
  
        this.cards = [
          { title: 'Precio de Alquiler', icon: 'cash-outline', value: `RD$ ${this.vivienda.precio_alquiler || 0}`, type: 'primary' },
          { title: 'Monto Pendiente', icon: 'wallet-outline', value: `RD$ ${this.calculatePendingAmount()}`, type: this.calculatePendingAmount() > 0 ? 'danger' : 'success' },
          { title: 'Próximo Pago', icon: 'calendar-outline', value: this.nextPaymentDate || 'No registrado', type: this.calculatePendingAmount() > 0 ? 'danger' : 'warning' }
        ];
  
        this.loadPaymentHistory(headers);
  
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: async (err) => {
        console.error('❌ Error al cargar datos del inquilino:', err);
        this.isLoading = false;
        if (err.status === 401 || err.status === 403) {
          await this.showAlert('Sesión Expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          localStorage.removeItem('inquilinoToken');
          this.router.navigate(['/login-inquilinos']);
        } else if (err.status === 404) {
          await this.showAlert('Error', 'No se encontraron datos del inquilino. Contacta al administrador.');
        } else {
          await this.showAlert('Error', 'Ocurrió un error al cargar los datos. Intenta nuevamente.');
        }
        if (event) event.target.complete();
      }
    });
  }

  loadPaymentHistory(headers: HttpHeaders) {
    if (!this.inquilino.id) {
      console.warn('No se puede cargar el historial de pagos: inquilino.id no está definido');
      return;
    }
    this.http.get<Factura[]>(`${environment.apiUrl}/facturas/inquilino`, { headers }).subscribe({
      next: (facturas) => {
        console.log('Historial de pagos recibido:', facturas);
        this.paymentHistory = facturas.flatMap((factura: Factura) => factura.pagos || []);
        this.updateCharts();
      },
      error: (err) => {
        console.error('❌ Error al cargar historial de pagos:', err);
      }
    });
  }

  calculateNextPayment() {
    const today = new Date();
    const lastPaymentDate = this.inquilino.ultimo_pago_fecha ? new Date(this.inquilino.ultimo_pago_fecha) : null;
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    if (!lastPaymentDate || this.isPaymentOverdue(lastPaymentDate, today)) {
      if (today.getDate() > (lastDayOfMonth === 31 ? 30 : lastDayOfMonth)) {
        this.inquilino.ultimo_pago_estado = 'Atrasado';
        this.nextPaymentDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-30`;
      } else {
        this.inquilino.ultimo_pago_estado = 'Pendiente';
        this.nextPaymentDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-30`;
      }
    } else {
      const nextPaymentMonth = new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 1));
      this.nextPaymentDate = `${nextPaymentMonth.getFullYear()}-${String(nextPaymentMonth.getMonth() + 1).padStart(2, '0')}-30`;
      this.inquilino.ultimo_pago_estado = 'Pagado';
    }
  }

  isPaymentOverdue(lastPayment: Date, today: Date): boolean {
    const lastPaymentMonth = lastPayment.getMonth();
    const lastPaymentYear = lastPayment.getFullYear();
    const lastDayOfLastMonth = new Date(lastPaymentYear, lastPaymentMonth + 1, 0).getDate();
    const paymentDueDate = new Date(lastPaymentYear, lastPaymentMonth, lastDayOfLastMonth > 30 ? 30 : lastDayOfLastMonth);

    return today > paymentDueDate && lastPayment.getDate() <= (lastDayOfLastMonth > 30 ? 30 : lastDayOfLastMonth);
  }

  hasPaidThisMonth(): boolean {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return this.paymentHistory.some(pago => {
      const pagoDate = new Date(pago.fecha_pago);
      return pagoDate.getMonth() === currentMonth && pagoDate.getFullYear() === currentYear;
    });
  }

  async registerPayment() {
    if (this.hasPaidThisMonth()) {
      await this.showAlert('⚠️ Pago No Permitido', 'Ya has registrado un pago este mes. Solo puedes pagar una vez por mes con Tarjeta/Transferencia.');
      return;
    }

    const token = localStorage.getItem('inquilinoToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    if (this.calculatePendingAmount() > 0 && today.getDate() > (lastDayOfMonth === 31 ? 30 : lastDayOfMonth)) {
      await this.showAlert('⚠️ Pago Atrasado', 'Debes regularizar el pago del mes anterior antes de pagar el próximo mes.');
      return;
    }

    if (!this.inquilino.ultimo_pago_fecha || this.isPaymentOverdue(new Date(this.inquilino.ultimo_pago_fecha), today)) {
      const paymentMonth = this.nextPaymentDate ? new Date(this.nextPaymentDate) : null;
      if (paymentMonth && paymentMonth.getMonth() !== currentMonth) {
        await this.showAlert('⚠️ Pago Inválido', 'No puedes pagar el mes siguiente hasta regularizar el mes actual.');
        return;
      }
    }

    const loading = await this.loadingCtrl.create({
      message: 'Registrando pago...',
      spinner: 'crescent'
    });
    await loading.present();

    this.http.post<any>(`${environment.apiUrl}/pagos`, {
      inquilino_id: this.inquilino.id,
      vivienda_id: this.inquilino.vivienda_id,
      monto: this.vivienda.precio_alquiler,
      metodo_pago: 'Tarjeta/Transferencia',
      fecha_pago: today.toISOString().split('T')[0],
      estado: 'Pagado'
    }, { headers }).subscribe({
      next: async (res) => {
        await loading.dismiss();
        this.showAlert('✅ Pago registrado', 'Tu pago ha sido registrado exitosamente.');
        this.loadInquilinoData();
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('❌ Error al registrar pago:', err);
        this.showAlert('⚠️ Error', 'No se pudo registrar el pago. Intenta nuevamente.');
      }
    });
  }

  async contactOwner() {
    const token = localStorage.getItem('inquilinoToken');
    if (!token) {
      await this.showAlert('⚠️ Error', 'No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
      this.router.navigate(['/login-inquilinos']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const alert = await this.alertCtrl.create({
      header: 'Contactar al Dueño',
      message: 'Escribe un mensaje para notificar al propietario que deseas realizar el pago.',
      inputs: [
        {
          name: 'mensaje',
          type: 'textarea',
          placeholder: 'Escribe tu mensaje aquí...'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: async (data) => {
            if (!data.mensaje) {
              await this.showAlert('⚠️ Error', 'Por favor, escribe un mensaje antes de enviar.');
              return false;
            }

            // Validar que inquilino_id y admin_id estén definidos
            if (!this.inquilino.id || !this.inquilino.admin_id) {
              await this.showAlert('⚠️ Error', 'No se pudo enviar el mensaje: datos del inquilino incompletos.');
              return false;
            }

            const mensajeData = {
              inquilino_id: this.inquilino.id,
              admin_id: this.inquilino.admin_id,
              mensaje: data.mensaje,
              fecha: new Date().toISOString().split('T')[0],
              tipo: 'Solicitud de Pago'
            };
            console.log('Datos enviados:', mensajeData);
            console.log('Headers enviados:', headers);

            const loading = await this.loadingCtrl.create({
              message: 'Enviando mensaje...',
              spinner: 'crescent'
            });
            await loading.present();

            try {
              const response = await lastValueFrom(
                this.http.post<any>(`${environment.apiUrl}/mensajes`, mensajeData, { headers })
              );
              await loading.dismiss();
              await this.showAlert('✅ Mensaje Enviado', 'Tu mensaje ha sido enviado al propietario.');
              return true;
            } catch (err) {
              await loading.dismiss();
              console.error('❌ Error al enviar mensaje:', err);
              await this.showAlert('⚠️ Error', 'No se pudo enviar el mensaje. Intenta nuevamente.');
              return false;
            }
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
      buttons: ['OK'],
      cssClass: 'custom-alert'
    });
    await alert.present();
  }

  createChart(canvas: HTMLCanvasElement, label: string, color: string) {
    if (!canvas) {
      console.warn('Canvas no está disponible para crear el gráfico:', label);
      return;
    }

    try {
      const chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: label,
            data: label === 'Pagos Realizados' 
              ? this.paymentHistory.map(p => p.monto || 0).slice(-6) 
              : Array(6).fill(this.calculatePendingAmount()),
            borderColor: color,
            backgroundColor: 'transparent',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
      this.charts.push(chart);
    } catch (error) {
      console.error(`Error al crear el gráfico "${label}":`, error);
    }
  }

  updateCharts() {
    if (this.paymentsChart?.nativeElement) {
      this.createChart(this.paymentsChart.nativeElement, 'Pagos Realizados', '#2ECC71');
    } else {
      console.warn('El elemento paymentsChart no está disponible');
    }

    if (this.pendingChart?.nativeElement) {
      this.createChart(this.pendingChart.nativeElement, 'Monto Pendiente', '#E74C3C');
    } else {
      console.warn('El elemento pendingChart no está disponible');
    }
  }

  calculatePendingAmount(): number {
    const lastPayment = this.paymentHistory.length > 0 ? this.paymentHistory[this.paymentHistory.length - 1].monto || 0 : 0;
    const alquiler = this.vivienda.precio_alquiler || 0;
    return alquiler - lastPayment > 0 ? alquiler - lastPayment : 0;
  }

  calculatePendingNotifications(): number {
    return this.calculatePendingAmount() > 0 ? 1 : 0;
  }

  handleMenuClick(menu: any): void {
    if (menu.action) {
      switch (menu.action) {
        case 'logout':
          this.logout();
          break;
      }
    }
  }

  logout(): void {
    localStorage.removeItem('inquilinoToken');
    this.router.navigate(['/login-inquilinos']);
  }

  onSearch(event: any) {
    console.log('Search query:', event.detail.value);
  }

  refreshContent(event: any) {
    this.loadInquilinoData(event);
  }

  openCard(card: any) {
    console.log('Card clicked:', card);
  }
}