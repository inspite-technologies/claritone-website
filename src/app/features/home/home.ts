import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  banners: Banner[] = [
    {
      id: 1,
      title: 'Rediscover the <span class="text-primary">Joy of Sound</span>',
      subtitle: 'ISO 9001:2015 CERTIFIED CLINIC',
      description: 'Expert hearing care solutions tailored to your lifestyle and comfort.',
      image: '/cheerful-multi-generation-family-with-dog-having-fun-while-spending-time-together-home.jpg',
      ctaText: 'Find Nearest Outlet',
      ctaLink: '/outlets'
    }
  ];

  currentIndex = 0;
  private interval: any;

  ngOnInit() {
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
