import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-services',
  imports: [RouterLink],
  templateUrl: './services.html',
  styleUrl: './services.css',
})
export class Services {
  constructor(private toastr: ToastrService) { }

  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  }

  exploreServices() {
    const element = document.getElementById('services-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.toastr.info('Exploring our comprehensive audiology services...');
    }
    console.log('Exploring services');
  }

  requestBrochure() {
    this.toastr.success('Thank you for your interest! The corporate brochure has been sent to your registered email.');
    console.log('Corporate brochure requested');
  }
}
