import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GalleryImage {
    id: string;
    src: string;
    category: 'All' | 'Equipments' | 'Brochures' | 'Products';
    title: string;
    alt: string;
}

@Component({
    selector: 'app-gallery',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './gallery.html'
})
export class Gallery implements OnInit {
    categories: string[] = ['All', 'Equipments', 'Brochures', 'Products'];
    activeCategory: string = 'All';

    // State for Lightbox zoom
    selectedImage: GalleryImage | null = null;
    isLightboxOpen: boolean = false;

    images: GalleryImage[] = [
        // Equipments
        { id: '1', src: 'audiometer.jpg', category: 'Equipments', title: 'Audiometer', alt: 'Audiometer diagnostic tool' },
        { id: '2', src: 'accuscreen.jpg', category: 'Equipments', title: 'Accuscreen', alt: 'Accuscreen hearing screening' },
        { id: '3', src: 'auddev.jpg', category: 'Equipments', title: 'Audio Device', alt: 'Advanced audio device' },
        { id: '15', src: 'tech1.jpg', category: 'Equipments', title: 'Advanced Tech 1', alt: 'Claritone advanced equipment 1' },
        { id: '16', src: 'tech2.jpg', category: 'Equipments', title: 'Advanced Tech 2', alt: 'Claritone advanced equipment 2' },
        { id: '17', src: 'tech3.jpg', category: 'Equipments', title: 'Advanced Tech 3', alt: 'Claritone advanced equipment 3' },
        // Brochures
        { id: '4', src: 'brochure1.jpg', category: 'Brochures', title: 'Claritone Brochure', alt: 'Claritone informational brochure' },
        { id: '13', src: 'IMG-20161117-WA0006.jpg', category: 'Brochures', title: 'Award Certificate', alt: 'Claritone award certificate' },
        { id: '14', src: 'EDCD84E9-EAA6-4952-A517-95739A7AFA45.jpeg', category: 'Brochures', title: 'Recognition Certificate', alt: 'Claritone recognition certificate' },
        // Products
        { id: '6', src: 'bte.jpg', category: 'Products', title: 'BTE Hearing Aid', alt: 'Behind-the-ear hearing aid' },
        { id: '7', src: 'ric.jpg', category: 'Products', title: 'RIC Hearing Aid', alt: 'Receiver-in-canal hearing aid' },
        { id: '8', src: 'cic.jpg', category: 'Products', title: 'CIC Hearing Aid', alt: 'Completely-in-canal hearing aid' },
        { id: '9', src: 'ifonos.jpg', category: 'Products', title: 'iFonos Series', alt: 'iFonos professional hearing aid' },
        { id: '10', src: 'microbte.jpg', category: 'Products', title: 'Micro BTE', alt: 'Micro size behind-the-ear aid' },
        { id: '11', src: '388DD641-A0C0-4FEC-823C-90E68C0EB0A2.jpeg', category: 'Products', title: 'Premium Hearing Solution', alt: 'Premium precision hearing aid' },
        { id: '12', src: 'sonic.jpg', category: 'Products', title: 'Sonic Hearing Aid', alt: 'Sonic hearing aid model' },
    ];

    filteredImages: GalleryImage[] = [];

    ngOnInit() {
        this.filterImages('All');
    }

    filterImages(category: string) {
        this.activeCategory = category;
        if (category === 'All') {
            this.filteredImages = [...this.images];
        } else {
            this.filteredImages = this.images.filter(img => img.category === category);
        }
    }

    openLightbox(image: GalleryImage) {
        this.selectedImage = image;
        this.isLightboxOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent page scrolling
    }

    closeLightbox() {
        this.isLightboxOpen = false;
        setTimeout(() => {
            this.selectedImage = null;
            document.body.style.overflow = 'auto'; // Restore page scrolling
        }, 300); // Wait for fade out animation
    }
}
