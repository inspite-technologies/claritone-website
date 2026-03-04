import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AppointmentService, Language, Slot } from '../../services/appointment.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  mobileMenuOpen = false;
  showBookingModal = false;
  cartItemCount = 0;
  wishlistCount = 0;

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

  outlets = [
    { name: 'Downtown Medical Center', address: '450 Healthcare Plaza, Suite 200, Downtown Core, CA 90210' },
    { name: 'Westside Wellness Hub', address: '1280 Ocean Boulevard, Marina District, CA 90401' },
    { name: 'North Valley Clinic', address: '899 Mountain Road, Valley Square, CA 91301' }
  ];

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private appointmentService: AppointmentService
  ) { }

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    });
    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlistCount = items.length;
    });
    this.loadLanguages();
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

  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  openBookingModal() {
    this.showBookingModal = true;
    this.closeMobileMenu();
  }

  closeBookingModal() {
    this.showBookingModal = false;
    this.resetForm();
  }

  resetForm() {
    this.bookingForm = {
      name: '',
      location: '',
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

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}
