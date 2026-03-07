import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { ApiService } from '../../services/api.service';
import { AppointmentService, Language, Slot } from '../../services/appointment.service';
import { StoreService, Store } from '../../services/store.service';
import { ToastrService } from 'ngx-toastr';

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
    notes: '',
    consultation: 'Offline'
  };

  stores: Store[] = [];
  isLoadingStores = false;

  constructor(
    private cartService: CartService,
    private wishlistService: WishlistService,
    private appointmentService: AppointmentService,
    private apiService: ApiService,
    private storeService: StoreService,
    private toastr: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.cartService.cart$.subscribe(items => {
      this.cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
    });
    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlistCount = items.length;
    });

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

    this.appointmentService.showBookingModal$.subscribe(() => {
      this.openBookingModal();
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

    if (this.bookingForm.preferredDay && (this.bookingForm.location || this.bookingForm.consultation === 'Online')) {
      this.isLoadingSlots = true;
      this.availableSlots = [];
      this.bookingForm.slotId = '';

      const storeId = this.bookingForm.consultation === 'Online' ? '' : this.bookingForm.location;
      this.appointmentService.getAvailableSlots(this.bookingForm.preferredDay, storeId).subscribe({
        next: (slots) => {
          console.log('Slots received in Header:', slots);
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
    if (!this.isAuthenticated) {
      this.toastr.info('Please login to book an appointment', 'Login Required');
      this.router.navigate(['/login']);
      return;
    }
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
      notes: '',
      consultation: 'Offline'
    };
    this.availableSlots = [];
  }

  submitBooking() {
    if (!this.isAuthenticated) {
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

  getMinDate(): string {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('claritone_token');
    }
    return false;
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('claritone_token');
      this.cartService.clearCart();
      this.wishlistService.clearWishlist();
      this.toastr.success('Logged out successfully', 'Success');
      this.router.navigate(['/']);
    }
  }
}
