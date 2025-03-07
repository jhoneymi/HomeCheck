import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // Necesario para inicializar Ionic
import { RouterModule } from '@angular/router'; // Necesario para el enrutamiento
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [
    IonApp, 
    IonRouterOutlet],
})
export class AppComponent {
  constructor() {}
}
