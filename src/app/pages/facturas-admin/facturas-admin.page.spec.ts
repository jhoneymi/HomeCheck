import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FacturasAdminPage } from './facturas-admin.page';

describe('FacturasAdminPage', () => {
  let component: FacturasAdminPage;
  let fixture: ComponentFixture<FacturasAdminPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FacturasAdminPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
