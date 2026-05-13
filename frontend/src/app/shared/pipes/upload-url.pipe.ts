import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

const STORAGE_BASE = environment.services.materials.replace('/api/v1', '');

@Pipe({ name: 'uploadUrl', standalone: true, pure: true })
export class UploadUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/uploads/')) return `${STORAGE_BASE}${url}`;
    return url;
  }
}
