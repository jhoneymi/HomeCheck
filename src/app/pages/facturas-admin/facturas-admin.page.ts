import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-facturas-admin',
  templateUrl: './facturas-admin.page.html',
  styleUrls: ['./facturas-admin.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class FacturasAdminPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
