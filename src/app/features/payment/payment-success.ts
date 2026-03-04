import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-payment-success',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './payment-success.html',
    styles: [`
    .success-icon-animate {
      animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    @keyframes scaleIn {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class PaymentSuccess {
    orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    deliveryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}
