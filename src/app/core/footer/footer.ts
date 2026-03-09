import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  constructor(private appointmentService: AppointmentService) { }

  openBooking() {
    this.appointmentService.triggerBookingModal();
  }
}
