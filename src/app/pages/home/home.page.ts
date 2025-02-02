import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonIcon, IonItem, IonList, IonBadge } from '@ionic/angular/standalone';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonSearchbar, IonIcon, IonItem, IonList, IonBadge,
    CommonModule, FormsModule
  ]
})
export class HomePage implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChart!: ElementRef;
  @ViewChild('tasksChart') tasksChart!: ElementRef;

  constructor() { }

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
          data: [10, 20, 15, 25, 30, 40],
          borderColor: color,
          backgroundColor: 'transparent',
          tension: 0.4
        }]
      }
    });
  }
}