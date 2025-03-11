import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InquilinosService } from './inquilinos.service';
import { HttpHeaders } from '@angular/common/http'; // Importar HttpHeaders
import { environment } from 'src/environments/environment';

describe('InquilinosService', () => {
  let service: InquilinosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InquilinosService]
    });
    service = TestBed.inject(InquilinosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get inquilinos', () => {
    const dummyInquilinos = [{ id: 1, nombre: 'Juan' }];
    const headers = new HttpHeaders().set('Authorization', 'Bearer token');
    service.getInquilinos(headers).subscribe(inquilinos => {
      expect(inquilinos).toEqual(dummyInquilinos);
    });
    const req = httpMock.expectOne(`${environment.apiUrl}/inquilinos`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token'); // Verificar el encabezado
    req.flush(dummyInquilinos);
  });
});