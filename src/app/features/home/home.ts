import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BannerService } from '../../services/banner.service';

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

  currentIndex = 0;
  private interval: any;

  constructor(
    private bannerService: BannerService,
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
    this.currentIndex = (this.currentIndex + 1) % this.banners.length;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.banners.length) % this.banners.length;
  }

  goToSlide(index: number) {
    this.currentIndex = index;
    this.stopAutoplay();
    this.startAutoplay();
  }
}
