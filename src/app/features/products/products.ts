import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { ProductService, Product } from '../../services/product.service';
import { WishlistService } from '../../services/wishlist.service';
import { ChangeDetectorRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  showQuickView = false;
  selectedProduct: Product | null = null;
  products: Product[] = []; // Current page products
  allProducts: Product[] = []; // Original full list
  filteredProducts: Product[] = []; // Filtered list
  isLoading = true;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  pageSize = 6; // Changed to 6 for better grid layout (3x2 or 2x3)

  // Filters state
  activeFilters: { [key: string]: string[] } = {
    category: [],
    brand: []
  };

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    public wishlistService: WishlistService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) { }

  toggleWishlist(product: Product) {
    const success = this.wishlistService.toggleWishlist(product);
    if (success) {
      if (this.isInWishlist(product.id)) {
        this.toastr.success(`${product.name} added to wishlist!`, 'Success');
      } else {
        this.toastr.info(`${product.name} removed from wishlist.`, 'Wishlist');
      }
    }
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistService.isInWishlist(productId);
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    console.log('ProductsComponent: loadProducts called');
    this.isLoading = true;
    this.errorMessage = '';

    // Safety timeout - if it takes more than 8 seconds, something is likely wrong with the connection
    const loadTimeout = setTimeout(() => {
      if (this.isLoading && this.products.length === 0) {
        console.warn('ProductsComponent: Load taking too long, showing error.');
        this.isLoading = false;
        this.errorMessage = 'Connection is slow or backend is not responding. Please check your terminal.';
      }
    }, 8000);

    this.productService.getProducts().subscribe({
      next: (products) => {
        clearTimeout(loadTimeout);
        console.log('ProductsComponent: Data received successfully, length:', products ? products.length : 0);

        // SET LOADING TO FALSE IMMEDIATELY
        this.isLoading = false;

        this.allProducts = products || [];
        this.applyFilters();
        this.totalPages = Math.ceil(this.allProducts.length / this.pageSize);

        console.log('ProductsComponent: Final state - isLoading:', this.isLoading, 'productsToShow:', this.products.length);
        this.cdr.detectChanges(); // Force DOM update
      },
      error: (err) => {
        clearTimeout(loadTimeout);
        console.error('ProductsComponent: Error caught in subscription:', err);
        this.errorMessage = 'Failed to load products. Make sure your backend (Port 5050) is running.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleFilter(type: string, value: string) {
    const filters = this.activeFilters[type];
    const index = filters.indexOf(value);
    if (index > -1) {
      filters.splice(index, 1);
    } else {
      filters.push(value);
    }
  }

  applyFilters() {
    let filtered = [...this.allProducts];

    // Filter by category
    if (this.activeFilters['category'].length > 0) {
      filtered = filtered.filter(p => this.activeFilters['category'].includes(p.category));
    }

    // Filter by brand
    if (this.activeFilters['brand'].length > 0) {
      filtered = filtered.filter(p => this.activeFilters['brand'].includes(p.brand));
    }

    this.filteredProducts = filtered;
    this.updatePagination();
    console.log('Filtered products:', this.filteredProducts.length);
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.products = this.filteredProducts.slice(start, end);
  }

  getPaginationRange(): number[] {
    const range = [];
    for (let i = 1; i <= this.totalPages; i++) {
      range.push(i);
    }
    return range;
  }

  resetFilters() {
    this.activeFilters = {
      category: [],
      brand: []
    };
    this.applyFilters();
    // Re-fetch to clear checkbox states in UI if they were manual
    // Alternatively, using a form group would be better, but this works for now.
    window.location.reload(); // Quick way to reset all checkbox states
  }

  quickView(productId: string) {
    this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.selectedProduct = product;
        this.showQuickView = true;
        if (this.selectedProduct) {
          console.log('Quick view for:', this.selectedProduct.name);
        }
      },
      error: (err) => console.error('Error fetching product details:', err)
    });
  }

  viewProductDetail(productId: string) {
    this.closeQuickView();
    this.router.navigate(['/products', productId]);
  }

  closeQuickView() {
    this.showQuickView = false;
    this.selectedProduct = null;
  }

  addToCart(product: Product) {
    const success = this.cartService.addToCart(product, 1);
    if (success) {
      this.toastr.success(`${product.name} added to cart!`, 'Success');
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
    const element = document.getElementById('products-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  }

  viewLatestDeals() {
    const element = document.getElementById('products-grid');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
