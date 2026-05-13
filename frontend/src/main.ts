import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { appConfig } from './app/app.config';
import { App } from './app/app';

registerLocaleData(localeEsCO);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
