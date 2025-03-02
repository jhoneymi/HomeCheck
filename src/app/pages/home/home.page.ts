import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
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
  logoTwitter 
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
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
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
    RouterModule,
    CommonModule, 
    FormsModule
  ]
})
export class HomePage implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChart!: ElementRef;
  @ViewChild('tasksChart') tasksChart!: ElementRef;

  notificationCount: number = 5;

  // Menú lateral dinámico
  sidebarMenu = [
    { title: 'Home', icon: 'home-outline', active: true, route: '/home' },
    { title: 'Facturas', icon: 'document-text-outline', active: false, route: '/facturas' },
    { title: 'Inquilinos', icon: 'people-outline', active: false, route: '/inquilinos' },
    { title: 'Viviendas', icon: 'business-outline', active: false, route: '/viviendas' }
  ];

  // Tarjetas dinámicas
  cards = [
    { title: 'Revenue', icon: 'storefront-outline', value: '$34,245', type: 'success' },
    { title: 'Used Space', icon: 'documents-outline', value: '49/50 GB', type: 'warning' },
    { title: 'Fixed Issues', icon: 'alert-circle-outline', value: '75', type: 'danger' },
    { title: 'Followers', icon: 'logo-twitter', value: '+245', type: 'primary' }
  ];

  constructor() {
    addIcons({
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
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.createChart(this.salesChart.nativeElement, 'Daily Sales', '#2ECC71');
    this.createChart(this.tasksChart.nativeElement, 'Completed Tasks', '#E74C3C');
  }

  createChart(canvas: any, label: string, color: string) {
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['M', 'T', 'W', 'T', 'F', 'S'],
        datasets: [{
          label: label,
          data: [10, 20, 15, 25, 30, 40],
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
  }

  onSearch(event: any) {
    console.log('Search query:', event.detail.value);
  }

  refreshContent(event: any) {
    console.log('Refreshing content...');
    setTimeout(() => {
      event.target.complete();
    }, 1500);
  }

  openCard(card: any) {
    console.log('Card clicked:', card);
  }
}