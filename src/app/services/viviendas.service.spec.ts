import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ViviendasService, Vivienda, ViviendaEdit } from './viviendas.service';
import { AuthService } from './auth.service';

describe('ViviendasService', () => {
  let service: ViviendasService;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // Mock de AuthService
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);
    authServiceSpy.getToken.and.returnValue('mock-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ViviendasService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ViviendasService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceMock = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Prueba para getViviendas
  it('should retrieve viviendas from the API with token', () => {
    const dummyViviendas: Vivienda[] = [
      {
        id: 1,
        nombre: 'Casa Azul',
        direccion: 'Calle 123, Ciudad',
        estado: 'No Alquilada',
        img: 'assets/img/milton.jpg',
        id_adm: 1,
        fecha_registro: '2023-10-01T12:00:00.000Z',
        precio_alquiler: 600.50,
        notas: 'Disponible desde noviembre'
      }
    ];

    service.getViviendas().subscribe(viviendas => {
      expect(viviendas.length).toBe(1);
      expect(viviendas).toEqual(dummyViviendas);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/viviendas');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush(dummyViviendas);
  });

  // Prueba para addVivienda
  it('should add a vivienda via POST with token', () => {
    const dummyVivienda = {
      nombre: 'Casa Nueva',
      direccion: 'Avenida 456',
      estado: 'Alquilada',
      img: new File([''], 'casa.jpg', { type: 'image/jpeg' }),
      id_adm: 1,
      precio_alquiler: 700.25,
      notas: 'Necesita mantenimiento'
    };

    const mockResponse = { message: 'Vivienda agregada', id: 2 };

    service.addVivienda(dummyVivienda).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/viviendas');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    expect(req.request.body.get('nombre')).toBe('Casa Nueva');
    expect(req.request.body.get('direccion')).toBe('Avenida 456');
    expect(req.request.body.get('estado')).toBe('Alquilada');
    expect(req.request.body.get('id_adm')).toBe('1');
    expect(req.request.body.get('img')).toBeTruthy();
    expect(req.request.body.get('precio_alquiler')).toBe('700.25');
    expect(req.request.body.get('notas')).toBe('Necesita mantenimiento');
    req.flush(mockResponse);
  });

  // Prueba para addVivienda sin token
  it('should throw an error if no token is available for addVivienda', () => {
    authServiceMock.getToken.and.returnValue(null);

    const dummyVivienda = {
      nombre: 'Casa Nueva',
      direccion: 'Avenida 456',
      estado: 'Alquilada',
      img: new File([''], 'casa.jpg', { type: 'image/jpeg' }),
      id_adm: 1,
      precio_alquiler: 700.25,
      notas: 'Necesita mantenimiento'
    };

    expect(() => service.addVivienda(dummyVivienda)).toThrowError('No se encontró un token de autenticación. Por favor, inicia sesión.');
  });

  // Prueba para updateVivienda
  it('should update a vivienda via PUT with token', () => {
    const id = 1;
    const updatedVivienda: ViviendaEdit = {
      id: 1,
      nombre: 'Casa Actualizada',
      estado: 'Alquilada',
      img: new File([''], 'casa_actualizada.jpg', { type: 'image/jpeg' }),
      precio_alquiler: 750.75,
      notas: 'Actualizado el 15/11/2023'
    };

    const mockResponse = { message: 'Vivienda actualizada con éxito', data: updatedVivienda };

    service.updateVivienda(id, updatedVivienda).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/viviendas/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    expect(req.request.body.get('id')).toBe('1');
    expect(req.request.body.get('nombre')).toBe('Casa Actualizada');
    expect(req.request.body.get('estado')).toBe('Alquilada');
    expect(req.request.body.get('img')).toBeTruthy();
    expect(req.request.body.get('precio_alquiler')).toBe('750.75');
    expect(req.request.body.get('notas')).toBe('Actualizado el 15/11/2023');
    req.flush(mockResponse);
  });

  // Prueba para deleteVivienda
  it('should delete a vivienda via DELETE with token', () => {
    const id = 1;
    const mockResponse = { message: 'Vivienda eliminada' };

    service.deleteVivienda(id).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/auth/viviendas/1');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
    req.flush(mockResponse);
  });
});