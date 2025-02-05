import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViviendasPage } from './viviendas.page';

describe('ViviendasPage', () => {
  let component: ViviendasPage;
  let fixture: ComponentFixture<ViviendasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViviendasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
