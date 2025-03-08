import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-modal-agregar-vivienda',
  templateUrl: './modal-agregar-vivienda.component.html',
  styleUrls: ['./modal-agregar-vivienda.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule]
})
export class ModalAgregarViviendaComponent {
  nuevaVivienda: any = {
    nombre: '',
    direccion: '',
    estado: '',
    img: null,
    id_adm: null
  };

  constructor(
    private modalController: ModalController,
    private authService: AuthService
  ) {
    const userId = this.authService.getUserId();
    if (userId) {
      this.nuevaVivienda.id_adm = userId;
    } else {
      console.warn('No se encontró un usuario autenticado. Usando 1 como predeterminado para pruebas.');
      this.nuevaVivienda.id_adm = 1;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.nuevaVivienda.img = file;
      console.log('Archivo seleccionado:', file);
    }
  }

  async guardar() {
    if (this.nuevaVivienda.nombre && this.nuevaVivienda.direccion && this.nuevaVivienda.estado && this.nuevaVivienda.img) {
      await this.modalController.dismiss(this.nuevaVivienda, 'confirm');
    } else {
      alert('Por favor, completa todos los campos.');
    }
  }

  async cancelar() {
    await this.modalController.dismiss(null, 'cancel');
  }
}