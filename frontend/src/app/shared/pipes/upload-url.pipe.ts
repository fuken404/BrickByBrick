import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Resuelve las URL de archivos subidos (/uploads/...) contra el gateway. */
@Pipe({ name: 'uploadUrl', standalone: true })
export class UploadUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string {
    if (!url) return '';
    return url.startsWith('/uploads/') ? `${environment.assetsUrl}${url}` : url;
  }
}
