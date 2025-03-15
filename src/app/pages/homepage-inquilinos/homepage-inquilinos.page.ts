import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-homepage-inquilinos',
  templateUrl: './homepage-inquilinos.page.html',
  styleUrls: ['./homepage-inquilinos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class HomepageInquilinosPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
