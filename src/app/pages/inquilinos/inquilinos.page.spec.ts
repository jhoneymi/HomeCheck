import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InquilinosPage } from './inquilinos.page';

describe('InquilinosPage', () => {
  let component: InquilinosPage;
  let fixture: ComponentFixture<InquilinosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InquilinosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
