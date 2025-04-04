import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InquilinoProfilePage } from './inquilino-profile.page';

describe('InquilinoProfilePage', () => {
  let component: InquilinoProfilePage;
  let fixture: ComponentFixture<InquilinoProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InquilinoProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
