import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';

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

  constructor(private modalController: ModalController) {}

  async guardar() {
    console.log('Datos del inquilino:', this.inquilino);
    await this.modalController.dismiss(this.inquilino, 'confirm');
  }

  async cancelar() {
    await this.modalController.dismiss(null, 'cancel');
  }
}