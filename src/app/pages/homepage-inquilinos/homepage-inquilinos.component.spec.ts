import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HomepageInquilinosComponent } from './homepage-inquilinos.component';

describe('HomepageInquilinosComponent', () => {
  let component: HomepageInquilinosComponent;
  let fixture: ComponentFixture<HomepageInquilinosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HomepageInquilinosComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HomepageInquilinosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
