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
    id_adm: null,
    precio_alquiler: null, // Nuevo campo
    notas: '' // Nuevo campo
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
    if (this.nuevaVivienda.nombre && this.nuevaVivienda.direccion && this.nuevaVivienda.estado && this.nuevaVivienda.img && this.nuevaVivienda.precio_alquiler !== null) {
      // Convertimos precio_alquiler a número para asegurar compatibilidad con el backend
      this.nuevaVivienda.precio_alquiler = Number(this.nuevaVivienda.precio_alquiler);
      await this.modalController.dismiss(this.nuevaVivienda, 'confirm');
    } else {
      alert('Por favor, completa todos los campos obligatorios (nombre, dirección, estado, imagen y precio de alquiler).');
    }
  }

  validarPrecio() {
    if (this.nuevaVivienda.precio_alquiler !== null && this.nuevaVivienda.precio_alquiler <= 0) {
      this.nuevaVivienda.precio_alquiler = null;
      alert('El precio de alquiler debe ser mayor a 0.');
    }
  }

  async cancelar() {
    await this.modalController.dismiss(null, 'cancel');
  }
}