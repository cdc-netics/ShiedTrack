import { Injectable } from '@angular/core';
import anime from 'animejs';

/**
 * Servicio centralizado de animaciones
 * Proporciona animaciones reutilizables para toda la aplicación
 */
@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  /**
   * Anima la entrada de elementos con fade-in y translateY
   */
  fadeInUp(target: string | HTMLElement, delay = 0): void {
    anime({
      targets: target,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 600,
      delay,
      easing: 'easeOutCubic'
    });
  }

  /**
   * Anima la entrada de elementos desde la izquierda
   */
  slideInLeft(target: string | HTMLElement, delay = 0): void {
    anime({
      targets: target,
      opacity: [0, 1],
      translateX: [-30, 0],
      duration: 500,
      delay,
      easing: 'easeOutExpo'
    });
  }

  /**
   * Anima la entrada de elementos desde la derecha
   */
  slideInRight(target: string | HTMLElement, delay = 0): void {
    anime({
      targets: target,
      opacity: [0, 1],
      translateX: [30, 0],
      duration: 500,
      delay,
      easing: 'easeOutExpo'
    });
  }

  /**
   * Anima una lista de elementos con retraso escalonado
   */
  staggerFadeIn(targets: string, staggerDelay = 50): void {
    anime({
      targets,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 500,
      delay: anime.stagger(staggerDelay),
      easing: 'easeOutQuad'
    });
  }

  /**
   * Pulse suave para llamar la atención
   */
  pulse(target: string | HTMLElement): void {
    anime({
      targets: target,
      scale: [1, 1.05, 1],
      duration: 800,
      easing: 'easeInOutSine'
    });
  }

  /**
   * Shake horizontal para errores
   */
  shake(target: string | HTMLElement): void {
    anime({
      targets: target,
      translateX: [
        { value: -10, duration: 100 },
        { value: 10, duration: 100 },
        { value: -10, duration: 100 },
        { value: 10, duration: 100 },
        { value: 0, duration: 100 }
      ],
      easing: 'easeInOutSine'
    });
  }

  /**
   * Bounce para confirmaciones exitosas
   */
  bounce(target: string | HTMLElement): void {
    anime({
      targets: target,
      translateY: [
        { value: -15, duration: 200 },
        { value: 0, duration: 200 },
        { value: -8, duration: 150 },
        { value: 0, duration: 150 }
      ],
      easing: 'easeOutCubic'
    });
  }

  /**
   * Zoom in con fade
   */
  zoomIn(target: string | HTMLElement, delay = 0): void {
    anime({
      targets: target,
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 500,
      delay,
      easing: 'easeOutBack'
    });
  }

  /**
   * Flip horizontal para cambios de estado
   */
  flipX(target: string | HTMLElement): void {
    anime({
      targets: target,
      rotateY: [0, 180],
      duration: 600,
      easing: 'easeInOutSine'
    });
  }

  /**
   * Glow effect con border animation
   */
  glow(target: string | HTMLElement): void {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
      anime({
        targets: element,
        boxShadow: [
          '0 0 5px rgba(63, 81, 181, 0.3)',
          '0 0 20px rgba(63, 81, 181, 0.6)',
          '0 0 5px rgba(63, 81, 181, 0.3)'
        ],
        duration: 1500,
        easing: 'easeInOutSine',
        loop: 1
      });
    }
  }

  /**
   * Anima número contador (count-up)
   */
  countUp(target: HTMLElement, from: number, to: number, duration = 1000): void {
    const obj = { value: from };
    anime({
      targets: obj,
      value: to,
      duration,
      easing: 'easeOutCubic',
      round: 1,
      update: () => {
        target.textContent = Math.round(obj.value).toString();
      }
    });
  }

  /**
   * Loading dots animation
   */
  loadingDots(target: string): void {
    anime({
      targets: `${target} .dot`,
      translateY: [
        { value: -10, duration: 300 },
        { value: 0, duration: 300 }
      ],
      delay: anime.stagger(100),
      loop: true,
      easing: 'easeInOutSine'
    });
  }

  /**
   * Progress bar animation
   */
  progressBar(target: string | HTMLElement, percent: number): void {
    anime({
      targets: target,
      width: `${percent}%`,
      duration: 1000,
      easing: 'easeOutExpo'
    });
  }

  /**
   * Card entrance con flip y fade
   */
  cardEntrance(target: string): void {
    anime({
      targets: target,
      opacity: [0, 1],
      rotateY: [-90, 0],
      duration: 800,
      delay: anime.stagger(100),
      easing: 'easeOutExpo'
    });
  }

  /**
   * Morphing entre dos estados
   */
  morph(target: string | HTMLElement, properties: any, duration = 500): void {
    anime({
      targets: target,
      ...properties,
      duration,
      easing: 'easeInOutQuad'
    });
  }
}
