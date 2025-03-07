import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InquilinosService {
  private apiUrl = `${environment.apiUrl}/inquilinos`; // URL base para inquilinos}

  constructor(private http: HttpClient) {}

  // Método para obtener los inquilinos
  getInquilinos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl); // Hacer la solicitud GET
  }
}
