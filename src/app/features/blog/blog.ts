import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog.html',
  styleUrls: ['./blog.css']
})
export class Blog {
  categories = ['All', 'Hearing Health', 'Technology', 'Lifestyle', 'Company News'];
  activeCategory = 'All';

  featuredPost = {
    title: 'The Future of Hearing: AI-Powered Sound Processing',
    excerpt: 'Discover how artificial intelligence is revolutionizing the way we experience sound, making hearing aids smarter and more adaptable than ever before.',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop',
    date: 'February 4, 2026',
    author: 'Dr. Sarah Mitchell',
    category: 'Technology'
  };

  posts = [
    {
      title: '5 Signs You Might Need a Hearing Test',
      excerpt: 'Recognize the early warning signs of hearing loss and learn when it\'s time to see a specialist.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop',
      date: 'January 28, 2026',
      category: 'Hearing Health'
    },
    {
      title: 'Clariton X5: A New Era of Discreet Design',
      excerpt: 'Introducing our smallest, most powerful hearing aid yet. The X5 combines style with performance.',
      image: 'https://images.unsplash.com/photo-1599426012470-349070a2a4b8?q=80&w=400&h=300&auto=format&fit=crop',
      date: 'January 15, 2026',
      category: 'Company News'
    },
    {
      title: 'Living Fully with Hearing Aids',
      excerpt: 'Real stories from our community about how better hearing has transformed their daily lives.',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2069&auto=format&fit=crop',
      date: 'January 10, 2026',
      category: 'Lifestyle'
    },
    {
      title: 'Understanding Tinnitus: Causes and Management',
      excerpt: 'A comprehensive guide to understanding ringing in the ears and effective strategies for relief.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop',
      date: 'December 22, 2025',
      category: 'Hearing Health'
    }
  ];

  popularPosts = [
    'How to Clean Your Hearing Aids Properly',
    'The Benefit of Rechargeable Batteries',
    'Hearing Health and Cognitive Decline: The Link',
    'Clariton Locations Expanding in 2026'
  ];

  setActiveCategory(category: string) {
    this.activeCategory = category;
  }

  get filteredPosts() {
    if (this.activeCategory === 'All') {
      return this.posts;
    }
    return this.posts.filter(post => post.category === this.activeCategory);
  }

  readArticle(post: any) {
    alert(`Opening article: ${post.title}`);
    console.log('Reading article:', post);
  }

  loadMore() {
    alert('Loading more articles from our archives...');
    console.log('Loading more articles');
  }
}
