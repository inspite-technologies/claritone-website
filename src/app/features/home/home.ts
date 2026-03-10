import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BannerService } from '../../services/banner.service';
import { AppointmentService } from '../../services/appointment.service';

interface HomeBanner {
  id: string | number;
  title?: string;
  subtitle?: string;
  description?: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  banners: HomeBanner[] = [];
  displayBanners: HomeBanner[] = [];
  disableTransition = false;

  currentIndex = 0;
  private interval: any;

  constructor(
    private bannerService: BannerService,
    private appointmentService: AppointmentService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const defaultTitle = 'Rediscover the <span class="text-primary">Joy of Sound</span>';
    const defaultSubtitle = 'ISO 9001:2015 CERTIFIED CLINIC';
    const defaultDescription = 'Expert hearing care solutions tailored to your lifestyle and comfort.';
    const defaultCtaText = 'Find Nearest Outlet';
    const defaultCtaLink = '/outlets';

    this.bannerService.getActiveBanners().subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const apiBanners: HomeBanner[] = response.data.map(b => {
            const formattedUrl = b.imageUrl.replace(/\\/g, '/');
            const fullUrl = formattedUrl.startsWith('http') ? formattedUrl : `http://localhost:5050/${formattedUrl}`;
            return {
              id: b._id,
              title: defaultTitle,
              subtitle: defaultSubtitle,
              description: defaultDescription,
              ctaText: defaultCtaText,
              ctaLink: defaultCtaLink,
              image: fullUrl
            };
          });
          this.banners = apiBanners;
          this.displayBanners = [...this.banners, this.banners[0]];
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error fetching banners', err)
    });
    this.startAutoplay();
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  startAutoplay() {
    this.interval = setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  stopAutoplay() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  nextSlide() {
    if (this.banners.length > 1) {
      if (this.currentIndex === this.banners.length) {
        // We are already at the clone (index mapping logic fix below)
        // This case should ideally be handled by the reset logic
      }

      this.currentIndex++;
      this.cdr.detectChanges();

      if (this.currentIndex === this.banners.length) {
        // We just slid into the clone, now snap back to real first slide
        setTimeout(() => {
          this.disableTransition = true;
          this.currentIndex = 0;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.disableTransition = false;
            this.cdr.detectChanges();
          }, 50);
        }, 1200); // Wait for transition duration
      }
    }
  }

  prevSlide() {
    if (this.banners.length > 1) {
      if (this.currentIndex === 0) {
        // Move to clone and then snap (optional, focusing on nextSlide as requested)
        this.currentIndex = this.banners.length - 1;
      } else {
        this.currentIndex--;
      }
      this.cdr.detectChanges();
    }
  }

  goToSlide(index: number) {
    this.currentIndex = index;
    this.cdr.detectChanges();
    this.stopAutoplay();
    this.startAutoplay();
  }

  openBookingModal() {
    this.appointmentService.triggerBookingModal();
  }
}
