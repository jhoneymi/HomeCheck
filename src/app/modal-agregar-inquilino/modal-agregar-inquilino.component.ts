import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalController, AlertController } from '@ionic/angular'; // Importar AlertController
import { InquilinosService } from 'src/app/services/inquilinos.service';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { HttpErrorResponse } from '@angular/common/http';
import { closeOutline, chevronDownOutline, chevronForwardOutline } from 'ionicons/icons';

// Definir una interfaz para la respuesta de la API
interface ViviendasResponse {
  data?: any[];
  message?: string;
}

@Component({
  selector: 'app-modal-agregar-inquilino',
  templateUrl: './modal-agregar-inquilino.component.html',
  styleUrls: ['./modal-agregar-inquilino.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class ModalAgregarInquilinoComponent {
  @Input() inquilino: any = {
    nombre: '',
    telefono: '',
    email: '',
    vivienda_id: null,
    fecha_ingreso: '',
    estado: 'Activo',
    metodo_pago: 'Efectivo',
    documento: '',
    notas: '',
    referencias: ''
  };
  @Input() editMode: boolean = false;
  viviendas: any[] = [];
  showNotasReferencias: boolean = false;

  constructor(
    private modalController: ModalController,
    private inquilinosService: InquilinosService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private alertCtrl: AlertController // Esto ya debería funcionar con la importación
  ) {
    addIcons({
      closeOutline,
      chevronDownOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    console.log('Token actual:', this.authService.getToken());
    console.log('UserID actual:', this.authService.getUserId());
    const headers = this.inquilinosService.getHeaders();
    this.inquilinosService.getViviendasDisponibles(headers).subscribe({
      next: (data: any[] | ViviendasResponse) => {
        console.log('Viviendas recibidas (crudo):', data);
        if (Array.isArray(data)) {
          this.viviendas = data; // Si es un array directo
        } else {
          this.viviendas = data.data || []; // Si es un objeto con data
        }
        console.log('Viviendas asignadas al componente:', this.viviendas);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener viviendas disponibles:', err);
      }
    });
    if (this.editMode && this.inquilino) {
      this.inquilino = { ...this.inquilino };
      if (this.inquilino.notas || this.inquilino.referencias) {
        this.showNotasReferencias = true;
      }
    }
  }

  isFormValid(): boolean {
    return this.inquilino.nombre && this.inquilino.telefono && this.inquilino.documento &&
           this.inquilino.estado && this.inquilino.metodo_pago && this.inquilino.vivienda_id !== null;
  }

  toggleNotasReferencias() {
    this.showNotasReferencias = !this.showNotasReferencias;
  }

  async guardar() {
    console.log('Intentando guardar inquilino:', this.inquilino);
    if (!this.isFormValid()) {
      console.warn('Formulario no válido, no se guarda.');
      this.showAlert('⚠️ Error', 'Por favor, completa todos los campos requeridos.');
      return;
    }
  
    const headers = this.inquilinosService.getHeaders();
    const inquilinoData = {
      nombre: this.inquilino.nombre,
      telefono: this.inquilino.telefono,
      email: this.inquilino.email,
      vivienda_id: this.inquilino.vivienda_id,
      fecha_ingreso: this.inquilino.fecha_ingreso,
      estado: this.inquilino.estado,
      metodo_pago: this.inquilino.metodo_pago,
      documento: this.inquilino.documento,
      notas: this.inquilino.notas || null,
      referencias: this.inquilino.referencias || null,
      admin_id: this.inquilinosService.getUserId()
    };
  
    try {
      console.log('Enviando solicitud al backend:', inquilinoData);
      if (this.editMode) {
        await this.inquilinosService.updateInquilino(this.inquilino.id, inquilinoData, headers).toPromise();
        console.log('Inquilino actualizado exitosamente');
      } else {
        await this.inquilinosService.createInquilino(inquilinoData, headers).toPromise();
        console.log('Inquilino creado exitosamente');
      }
  
      await this.modalController.dismiss(inquilinoData, 'confirm');
      console.log('Modal cerrado con éxito');
    } catch (error) {
      console.error('Error al guardar inquilino:', error);
      const errorMessage = (error instanceof HttpErrorResponse) ? error.error.error || error.message : 'Error desconocido';
      this.showAlert('⚠️ Error', `No se pudo guardar el inquilino: ${errorMessage}`);
    }
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

  async cancelar() {
    await this.modalController.dismiss(null, 'cancel');
  }
}