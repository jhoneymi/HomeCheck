import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomepageInquilinosPage } from './homepage-inquilinos.page';

describe('HomepageInquilinosPage', () => {
  let component: HomepageInquilinosPage;
  let fixture: ComponentFixture<HomepageInquilinosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomepageInquilinosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
