import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './about.html'
})
export class About implements OnInit {
    activeTab: 'Common' | 'Medical' | 'Emotional' = 'Common';

    constructor() { }

    ngOnInit(): void {
        window.scrollTo(0, 0);
    }

    setTab(tab: 'Common' | 'Medical' | 'Emotional') {
        this.activeTab = tab;
    }
}
