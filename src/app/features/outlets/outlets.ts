import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AppointmentService, Language, Slot } from '../../services/appointment.service';

@Component({
  selector: 'app-outlets',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './outlets.html',
  styleUrl: './outlets.css',
})
export class Outlets implements OnInit {
  showBookingModal = false;
  selectedLocation = '';

  languages: Language[] = [];
  availableSlots: Slot[] = [];
  isLoadingSlots = false;

  bookingForm = {
    name: '',
    location: '',
    contactNumber: '',
    languageId: '',
    preferredDay: '',
    slotId: '',
    notes: ''
  };

  stores: any[] = [];
  isLoadingStores = true;

  constructor(
    private apiService: ApiService,
    private appointmentService: AppointmentService
  ) { }

  ngOnInit() {
    this.loadLanguages();
    this.loadStores();
  }

  loadStores() {
    this.isLoadingStores = true;
    this.apiService.get<any>('stores').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stores = res.data;
        }
        this.isLoadingStores = false;
      },
      error: (err) => {
        console.error('Failed to load stores', err);
        this.isLoadingStores = false;
      }
    });
  }

  loadLanguages() {
    this.appointmentService.getLanguages().subscribe({
      next: (langs) => this.languages = langs,
      error: (err) => console.error('Failed to load languages', err)
    });
  }

  onDateChange() {
    if (this.bookingForm.preferredDay) {
      this.isLoadingSlots = true;
      this.availableSlots = [];
      this.bookingForm.slotId = '';

      this.appointmentService.getAvailableSlots(this.bookingForm.preferredDay).subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.isLoadingSlots = false;
        },
        error: (err) => {
          console.error('Failed to load slots', err);
          this.isLoadingSlots = false;
        }
      });
    }
  }

  openBookingModal(locationName: string) {
    this.selectedLocation = locationName;
    this.bookingForm.location = locationName;
    this.showBookingModal = true;
  }

  closeBookingModal() {
    this.showBookingModal = false;
    this.resetForm();
  }

  onStateChange(event: any) {
    const selectedState = event.target.value;
    if (selectedState) {
      this.openBookingModal(`Any Clinic in ${selectedState}`);
      // Reset the dropdown back to "All States" so the user can select it again
      event.target.value = "";
    }
  }

  resetForm() {
    this.bookingForm = {
      name: '',
      location: this.selectedLocation,
      contactNumber: '',
      languageId: '',
      preferredDay: '',
      slotId: '',
      notes: ''
    };
    this.availableSlots = [];
  }

  submitBooking() {
    // Validate form
    if (!this.bookingForm.name || !this.bookingForm.contactNumber || !this.bookingForm.preferredDay || !this.bookingForm.slotId || !this.bookingForm.languageId) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      fullName: this.bookingForm.name,
      phone: this.bookingForm.contactNumber,
      languageId: this.bookingForm.languageId,
      date: this.bookingForm.preferredDay,
      slotId: this.bookingForm.slotId
    };

    this.appointmentService.createAppointment(payload).subscribe({
      next: (res) => {
        console.log('Booking submitted:', res);
        alert(`Appointment requested successfully!\n\nOur team will confirm your appointment shortly via phone.`);
        this.closeBookingModal();
      },
      error: (err) => {
        console.error('Booking failed', err);
        alert('Failed to book appointment. Please check your connection or try again later.');
      }
    });
  }


  useMyLocation() {
    alert('Requesting your current location...');
    console.log('Using my location');
  }

  getDirections(location: string) {
    alert(`Getting directions to ${location}...`);
    console.log('Getting directions to:', location);
  }

  toggleAllLocations() {
    alert('Loading all 15+ centers nationwide...');
    console.log('Toggling all locations');
  }

  expandMap() {
    alert('Opening interactive map in full view...');
    console.log('Expanding map');
  }

  requestHomeVisit() {
    alert('Request for home visit received! Our team will contact you shortly to schedule.');
    console.log('Home visit requested');
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
