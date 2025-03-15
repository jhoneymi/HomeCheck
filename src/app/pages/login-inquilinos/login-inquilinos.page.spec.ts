import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginInquilinosPage } from './login-inquilinos.page';

describe('LoginInquilinosPage', () => {
  let component: LoginInquilinosPage;
  let fixture: ComponentFixture<LoginInquilinosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginInquilinosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
