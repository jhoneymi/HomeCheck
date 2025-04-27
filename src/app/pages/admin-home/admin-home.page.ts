import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonList, IonItem, IonLabel, IonIcon, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { alertCircleOutline, shieldCheckmarkOutline, trendingUpOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.page.html',
  styleUrls: ['./admin-home.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonList, IonItem, IonLabel, IonIcon, IonGrid, IonRow, IonCol,
    CommonModule, FormsModule, BaseChartDirective, RouterLink
  ]
})
export class AdminHomePage implements OnInit {
  totalOwners: number = 0;
  totalProperties: number = 0;
  totalTenants: number = 0;
  totalIncome: number = 0;
  occupiedProperties: number = 0;
  vacantProperties: number = 0;
  pendingPayments: number = 0;
  alerts: { message: string, link: string }[] = [];

  // Configuración del gráfico de propiedades ocupadas vs vacías
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#333', font: { size: 14 } } },
      tooltip: { backgroundColor: '#333', titleFont: { size: 14 }, bodyFont: { size: 12 } }
    }
  };
  public pieChartData: ChartData<'pie'> = {
    labels: ['Occupied', 'Vacant'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: ['#4CAF50', '#F44336'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 1
      }
    ]
  };
  public pieChartType: ChartType = 'pie';

  constructor(private http: HttpClient, private router: Router) {
    addIcons({ 
      alertCircleOutline,
      shieldCheckmarkOutline,
      trendingUpOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const roleId = localStorage.getItem('role_id');
    const token = localStorage.getItem('authToken');
  
    if (roleId !== '1' || !token) {
      this.router.navigate(['/login']);
      return;
    }
  
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    // Obtener todos los dueños
    this.http.get('http://localhost:3000/api/auth/admin/usuarios', { headers }).subscribe({
      next: (res: any) => {
        this.totalOwners = res.length;
      },
      error: (err) => {
        console.error('Error loading owners:', err);
      }
    });
  
    // Obtener todas las propiedades
    this.http.get('http://localhost:3000/api/auth/admin/viviendas', { headers }).subscribe({
      next: (res: any) => {
        this.totalProperties = res.length;
        this.occupiedProperties = res.filter((v: any) => v.estado === 'Alquilada').length;
        this.vacantProperties = res.filter((v: any) => v.estado === 'No Alquilada').length;
  
        // ... actualizas el gráfico y alertas como ya lo haces
      },
      error: (err) => {
        console.error('Error loading properties:', err);
      }
    });
  
    // Obtener todos los inquilinos
    this.http.get('http://localhost:3000/api/auth/admin/inquilinos', { headers }).subscribe({
      next: (res: any) => {
        this.totalTenants = res.length;
      },
      error: (err) => {
        console.error('Error loading tenants:', err);
      }
    });
  
    // Obtener todos los pagos
    this.http.get('http://localhost:3000/api/auth/admin/pagos', { headers }).subscribe({
      next: (res: any) => {
        this.totalIncome = res
          .filter((p: any) => p.estado === 'Pagado')
          .reduce((sum: number, p: any) => sum + parseFloat(p.monto), 0);
        this.pendingPayments = res.filter((p: any) => p.estado === 'Pendiente').length;
  
        // Alertas de pagos vencidos
        const overduePayments = res.filter((p: any) => {
          const dueDate = new Date(p.fecha_pago);
          return p.estado === 'Pendiente' && dueDate < new Date();
        });
        overduePayments.forEach((p: any) => {
          this.alerts.push({
            message: `Tenant with ID ${p.inquilino_id} has an overdue payment of $${p.monto}.`,
            link: `/admin-inquilinos/${p.inquilino_id}`
          });
        });
      },
      error: (err) => {
        console.error('Error loading payments:', err);
      }
    });
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('role_id');
    this.router.navigate(['/login']);
  }
}