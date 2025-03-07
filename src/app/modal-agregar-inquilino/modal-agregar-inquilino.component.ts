import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal-agregar-inquilino',
  templateUrl: './modal-agregar-inquilino.component.html',
  styleUrls: ['./modal-agregar-inquilino.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule]
})
export class ModalAgregarInquilinoComponent {
  inquilino = {
    nombreCompleto: '',
    telefono: '',
    email: '',
    referencias: '',
    cedula: '',
    fotoUrl: ''
  };

  constructor() {}

  guardar() {
    console.log('Datos del inquilino:', this.inquilino);
    const modal = document.querySelector('ion-modal');
    if (modal) modal.dismiss();
  }

  cancelar() {
    const modal = document.querySelector('ion-modal');
    if (modal) modal.dismiss();
  }
}