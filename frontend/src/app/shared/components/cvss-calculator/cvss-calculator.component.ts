import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CVSS_METRIC_GROUPS,
  CvssMetrics,
  CvssResult,
  CvssSeverity,
  calculateCvss31,
  parseCvssVector,
} from '../../utils/cvss';

interface SeverityBucket {
  key: CvssSeverity;
  label: string;
}

const SEVERITY_COLORS: Record<CvssSeverity, { bg: string; color: string }> = {
  CRITICAL: { bg: '#ffebee', color: '#c62828' },
  HIGH: { bg: '#fff3e0', color: '#e65100' },
  MEDIUM: { bg: '#fff9c4', color: '#f57f17' },
  LOW: { bg: '#e3f2fd', color: '#1565c0' },
  INFORMATIONAL: { bg: '#f5f5f5', color: '#616161' },
};

@Component({
  standalone: true,
  selector: 'app-cvss-calculator',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="cvss-calc">
      <div class="cvss-calc-header">
        <mat-icon>calculate</mat-icon>
        <div>
          <h3>Calculadora CVSS 3.1</h3>
          <p>Selecciona las métricas base para generar el score, la severidad y el vector CVSS 3.1.</p>
        </div>
      </div>

      <div class="severity-strip">
        @for (bucket of severityBuckets; track bucket.key) {
          <div class="severity-tab"
               [style.background]="result?.severity === bucket.key ? severityColors[bucket.key].bg : ''"
               [style.color]="result?.severity === bucket.key ? severityColors[bucket.key].color : ''">
            {{ bucket.label }}
          </div>
        }
      </div>

      <div class="score-panel">
        <div class="score-box" [style.color]="result ? severityColors[result.severity].color : '#9e9e9e'">
          <span class="score-value">{{ result ? result.score.toFixed(1) : '—' }}</span>
          <span class="score-max">/ 10</span>
        </div>
        <div class="score-meta">
          @if (result) {
            <span class="severity-badge"
                  [style.background]="severityColors[result.severity].bg"
                  [style.color]="severityColors[result.severity].color">
              {{ severityLabel(result.severity) }}
            </span>
            <div class="vector-row">
              <code>{{ result.vector }}</code>
              <button type="button" class="copy-btn" (click)="copyVector()" matTooltip="Copiar vector">
                <mat-icon>{{ copied ? 'check' : 'content_copy' }}</mat-icon>
              </button>
            </div>
          } @else {
            <span class="hint-text">Selecciona todas las métricas para calcular el score</span>
          }
        </div>
      </div>

      <div class="metrics-grid">
        @for (group of groups; track group.key) {
          <div class="metric-group">
            <label>{{ group.label }}</label>
            <div class="metric-options">
              @for (opt of group.options; track opt.key) {
                <button type="button" class="metric-option" [class.selected]="isSelected(group.key, opt.key)"
                        (click)="select(group.key, opt.key)">
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .cvss-calc { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 4px 0 20px; }
    .cvss-calc-header { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px; }
    .cvss-calc-header mat-icon { color: #1976d2; }
    .cvss-calc-header h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #263238; }
    .cvss-calc-header p { margin: 0; font-size: 13px; color: #757575; }

    .severity-strip { display: flex; border-radius: 6px; overflow: hidden; border: 1px solid #e0e0e0; margin-bottom: 16px; }
    .severity-tab { flex: 1; text-align: center; padding: 8px 4px; font-size: 12px; font-weight: 600; background: #fafafa; color: #9e9e9e; transition: background .15s, color .15s; }
    .severity-tab + .severity-tab { border-left: 1px solid #e0e0e0; }

    .score-panel { display: flex; gap: 20px; align-items: center; background: #f5f7fa; border-radius: 8px; padding: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .score-box { display: flex; align-items: baseline; gap: 4px; font-weight: 700; min-width: 90px; }
    .score-value { font-size: 34px; line-height: 1; }
    .score-max { font-size: 14px; color: #9e9e9e; }
    .score-meta { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 220px; }
    .severity-badge { display: inline-block; width: fit-content; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .vector-row { display: flex; align-items: center; gap: 8px; }
    .vector-row code { background: #eef2f7; padding: 4px 8px; border-radius: 4px; font-size: 12px; word-break: break-all; }
    .copy-btn { border: none; background: none; cursor: pointer; color: #1976d2; display: flex; align-items: center; padding: 2px; }
    .copy-btn mat-icon { font-size: 18px; height: 18px; width: 18px; }
    .hint-text { font-size: 13px; color: #9e9e9e; font-style: italic; }

    .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .metric-group label { display: block; font-size: 12px; font-weight: 600; color: #616161; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .03em; }
    .metric-options { display: flex; gap: 6px; flex-wrap: wrap; }
    .metric-option { border: 1px solid #dbe2ea; background: #fff; color: #455a64; padding: 6px 12px; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all .15s; }
    .metric-option:hover { border-color: #1976d2; }
    .metric-option.selected { background: #1976d2; border-color: #1976d2; color: #fff; }

    @media (max-width: 640px) {
      .metrics-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CvssCalculatorComponent implements OnChanges {
  /** Vector CVSS 3.1 ya guardado (modo edición) para preseleccionar las métricas */
  @Input() initialVector: string | null | undefined;
  @Output() resultChange = new EventEmitter<CvssResult>();

  readonly groups = CVSS_METRIC_GROUPS;
  readonly severityColors = SEVERITY_COLORS;
  readonly severityBuckets: SeverityBucket[] = [
    { key: 'INFORMATIONAL', label: 'Informativa' },
    { key: 'LOW', label: 'Baja' },
    { key: 'MEDIUM', label: 'Media' },
    { key: 'HIGH', label: 'Alta' },
    { key: 'CRITICAL', label: 'Crítica' },
  ];

  metrics: CvssMetrics = {};
  result: CvssResult | null = null;
  copied = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialVector'] && this.initialVector) {
      const parsed = parseCvssVector(this.initialVector);
      if (parsed) {
        this.metrics = parsed;
        this.recalculate();
      }
    }
  }

  select(groupKey: string, optionKey: string): void {
    this.metrics = { ...this.metrics, [groupKey]: optionKey };
    this.recalculate();
  }

  isSelected(groupKey: string, optionKey: string): boolean {
    return (this.metrics as any)[groupKey] === optionKey;
  }

  severityLabel(key: CvssSeverity): string {
    return this.severityBuckets.find(b => b.key === key)?.label ?? key;
  }

  copyVector(): void {
    if (!this.result) return;
    const vector = this.result.vector;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(vector).then(
        () => this.markCopied(),
        () => this.fallbackCopy(vector),
      );
    } else {
      this.fallbackCopy(vector);
    }
  }

  /** Fallback para contextos donde el Clipboard API está bloqueado (ej. webviews embebidos) */
  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      this.markCopied();
    } finally {
      document.body.removeChild(textarea);
    }
  }

  private markCopied(): void {
    this.copied = true;
    setTimeout(() => (this.copied = false), 1500);
  }

  private recalculate(): void {
    this.result = calculateCvss31(this.metrics);
    if (this.result) {
      this.resultChange.emit(this.result);
    }
  }
}
