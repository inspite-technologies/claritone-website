import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AppointmentService, Language, Slot } from '../../services/appointment.service';
import { StoreService, Store } from '../../services/store.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-outlets',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './outlets.html',
  styleUrl: './outlets.css',
})
export class Outlets implements OnInit {
  showBookingModal = false;
  selectedLocationId = '';
  selectedLocationName = '';


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
    notes: '',
    consultation: 'Offline'
  };

  contactForm = {
    name: '',
    mobileNumber: '',
    state: '',
    authorization: false
  };

  isSubmittingContact = false;

  stores: Store[] = [];
  isLoadingStores = true;
  visibleTimings: { [key: string]: boolean } = {};

  constructor(
    private apiService: ApiService,
    private appointmentService: AppointmentService,
    private storeService: StoreService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.storeService.loadInitialData();

    this.storeService.stores$.subscribe(stores => {
      this.stores = stores;
      this.cdr.detectChanges();
    });

    this.storeService.languages$.subscribe(langs => {
      this.languages = langs;
      this.cdr.detectChanges();
    });

    this.storeService.isLoadingStores$.subscribe(isLoading => {
      this.isLoadingStores = isLoading;
      this.cdr.detectChanges();
    });
  }

  onDateChange() {
    if (this.bookingForm.preferredDay) {
      const [year, month, day] = this.bookingForm.preferredDay.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, day);
      if (selectedDate.getDay() === 0) {
        this.toastr.error('Sundays are closed. Please select another day.', 'Store Closed');
        this.bookingForm.preferredDay = '';
        this.availableSlots = [];
        this.bookingForm.slotId = '';
        return;
      }
    }

    if (this.bookingForm.preferredDay && this.bookingForm.location) {
      this.isLoadingSlots = true;
      this.availableSlots = [];
      this.bookingForm.slotId = '';

      this.appointmentService.getAvailableSlots(this.bookingForm.preferredDay, this.bookingForm.location).subscribe({
        next: (slots) => {
          console.log('Slots received in Outlets:', slots);
          this.availableSlots = slots;
          this.isLoadingSlots = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load slots', err);
          this.isLoadingSlots = false;
          this.toastr.error('Failed to load available time slots', 'Error');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.availableSlots = [];
      this.bookingForm.slotId = '';
    }
  }

  openBookingModal(storeId: string) {
    if (!this.apiService.isAuthenticated()) {
      this.toastr.info('Please login to book an appointment', 'Login Required');
      this.router.navigate(['/login']);
      return;
    }

    const store = this.stores.find(s => s._id === storeId);
    this.selectedLocationId = storeId;
    this.selectedLocationName = store ? store.name : '';
    this.bookingForm.location = storeId;
    this.showBookingModal = true;

    // If a date happens to be pre-filled, fetch slots
    if (this.bookingForm.preferredDay) {
      this.onDateChange();
    }
  }

  closeBookingModal() {
    this.showBookingModal = false;
    this.resetForm();
  }

  resetForm() {
    this.bookingForm = {
      name: '',
      location: this.selectedLocationId,
      contactNumber: '',
      languageId: '',
      preferredDay: '',
      slotId: '',
      notes: '',
      consultation: 'Offline'
    };
    this.availableSlots = [];
  }

  submitBooking() {
    if (!this.apiService.isAuthenticated()) {
      this.toastr.warning('Session expired. Please login again.', 'Warning');
      this.router.navigate(['/login']);
      return;
    }

    // Validate form
    if (!this.bookingForm.name || !this.bookingForm.contactNumber || !this.bookingForm.preferredDay || !this.bookingForm.slotId || !this.bookingForm.languageId) {
      this.toastr.warning('Please fill in all required fields', 'Warning');
      return;
    }

    const payload = {
      fullName: this.bookingForm.name,
      phone: this.bookingForm.contactNumber,
      languageId: this.bookingForm.languageId,
      date: this.bookingForm.preferredDay,
      slotId: this.bookingForm.slotId,
      storeId: this.bookingForm.location,
      additionalNotes: this.bookingForm.notes,
      consultation: this.bookingForm.consultation
    };

    this.appointmentService.createAppointment(payload).subscribe({
      next: (res) => {
        console.log('Booking submitted:', res);
        this.toastr.success('Appointment requested successfully!\n\nOur team will confirm your appointment shortly via phone.', 'Success');
        this.closeBookingModal();
      },
      error: (err) => {
        console.error('Booking failed', err);
        this.toastr.error('Failed to book appointment. Please check your connection or try again later.', 'Error');
      }
    });
  }


  getDirections(location: string) {
    this.toastr.info(`Getting directions to ${location}...`);
    console.log('Getting directions to:', location);
  }

  toggleAllLocations() {
    this.toastr.info('Loading all 15+ centers nationwide...');
    console.log('Toggling all locations');
  }

  requestHomeVisit() {
    this.toastr.success('Request for home visit received! Our team will contact you shortly to schedule.', 'Success');
    console.log('Home visit requested');
  }

  toggleTimings(storeId: string) {
    this.visibleTimings[storeId] = !this.visibleTimings[storeId];
    this.cdr.detectChanges();
  }

  getMinDate(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  submitContactForm() {
    if (!this.contactForm.name || !this.contactForm.mobileNumber) {
      this.toastr.warning('Please fill in your name and mobile number', 'Warning');
      return;
    }

    this.isSubmittingContact = true;
    this.apiService.post('form/submit', this.contactForm).subscribe({
      next: (res: any) => {
        this.toastr.success(res.message || 'Thank you for contacting us! We will get back to you soon.', 'Success');
        this.contactForm = {
          name: '',
          mobileNumber: '',
          state: '',
          authorization: false
        };
        this.isSubmittingContact = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Contact form submission failed', err);
        this.toastr.error('Failed to send message. Please try again later.', 'Error');
        this.isSubmittingContact = false;
        this.cdr.detectChanges();
      }
    });
  }
}
