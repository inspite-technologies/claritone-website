import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-payment-failure',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './payment-failure.html'
})
export class PaymentFailure {
    errorMessages = [
        'Insufficient funds in your account.',
        'Transaction was declined by your bank.',
        'Invalid card details or CVV.',
        'Payment gateway timed out. Please try again.'
    ];
    randomError = this.errorMessages[Math.floor(Math.random() * this.errorMessages.length)];
}
