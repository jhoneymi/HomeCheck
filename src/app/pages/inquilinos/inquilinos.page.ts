import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonAvatar, IonCol, IonRow, IonGrid, IonButton, IonButtons } from '@ionic/angular/standalone';

@Component({
  selector: 'app-inquilinos',
  templateUrl: './inquilinos.page.html',
  styleUrls: ['./inquilinos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonAvatar, IonCol, IonToolbar, IonRow, IonButton, IonButtons, CommonModule, IonGrid, FormsModule]
})
export class InquilinosPage implements OnInit {
  
  inquilinos = [
    {
      nombre: 'Juan Mendoza Parra',
      telefono: '88290983764',
      email: 'HolaParrajuan123@gmail.com',
      referencia: 'Patricia Peres: 8097654321',
      cedula: '0908-8765432-1',
      foto: 'assets/foto1.png'
    },
    {
      nombre: 'Pedro González',
      telefono: '88290321234',
      email: 'pedro.gonzalez@mail.com',
      referencia: 'Luis Martinez: 8291234567',
      cedula: '0808-1234567-2',
      foto: 'assets/foto2.png'
    },
    {
      nombre: 'Ana López',
      telefono: '8298765432',
      email: 'ana.lopez@gmail.com',
      referencia: 'Carlos Pérez: 8099876543',
      cedula: '0707-7654321-3',
      foto: 'assets/foto3.png'
    }
  ];

  constructor() { }

  ngOnInit() { }
}