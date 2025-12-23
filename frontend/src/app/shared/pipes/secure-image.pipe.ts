import { Pipe, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Pipe({
  name: 'secureImage',
  standalone: true
})
export class SecureImagePipe implements PipeTransform {
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  transform(evidenceId: string): Observable<SafeUrl> {
    // Descarga binaria de evidencia y la expone como URL segura para el DOM
    return this.http
      .get(`http://localhost:3000/api/evidence/${evidenceId}/download`, {
        responseType: 'blob'
      })
      .pipe(
        map(blob => {
          // Crea un object URL temporal para usarlo en img/src
          const url = URL.createObjectURL(blob);
          return this.sanitizer.bypassSecurityTrustUrl(url);
        }),
        // Fallback a un SVG simple cuando falla la descarga
        catchError(() => of(this.sanitizer.bypassSecurityTrustUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FcnJvcjwvdGV4dD48L3N2Zz4=')))
      );
  }
}
