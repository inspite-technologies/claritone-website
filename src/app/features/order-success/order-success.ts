import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
    selector: 'app-order-success',
    imports: [CommonModule, RouterLink],
    templateUrl: './order-success.html',
    styleUrl: './order-success.css',
})
export class OrderSuccess implements OnInit {
    orderId: string = '';
    amount: number = 0;
    currentDate: string = new Date().toLocaleDateString();

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            this.orderId = params['orderId'] || 'N/A';
            this.amount = params['amount'] || 0;
        });
    }

    formatPrice(price: number): string {
        return '₹' + price.toLocaleString('en-IN');
    }
}
