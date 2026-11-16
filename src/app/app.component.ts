import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EnvService } from '@myrmidon/ngx-tools';

const THEME_KEY = 'ngx-annotorious-theme';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
})
export class AppComponent {
  private readonly _document = inject(DOCUMENT);

  protected readonly version = inject(EnvService).get('version') || '';
  protected readonly darkMode = signal(this.loadDarkMode());

  constructor() {
    effect(() => {
      const dark = this.darkMode();
      this._document.documentElement.classList.toggle('dark-mode', dark);
      try {
        localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
      } catch {
        // storage not available
      }
    });
  }

  private loadDarkMode(): boolean {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored) {
        return stored === 'dark';
      }
    } catch {
      // storage not available
    }
    return !!globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches;
  }

  protected toggleTheme(): void {
    this.darkMode.update((d) => !d);
  }
}
