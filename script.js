/**
 * Premier Schools Exhibition - Interactive Features
 * Handles sliders, animations, and accessibility
 */

(function() {
    'use strict';

    // Utility Functions
    // ==========================================================================

    /**
     * Debounce function to limit function calls
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Check if user prefers reduced motion
     */
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Detect if device is touch-enabled
     */
    function isTouchDevice() {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    }

    /**
     * Get viewport dimensions safely
     */
    function getViewportSize() {
        return {
            width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
        };
    }

    // Hero Slider
    // ==========================================================================

    class HeroSlider {
        constructor(container) {
            this.container = container;
            this.track = container.querySelector('.hero__slider-track');
            this.slides = container.querySelectorAll('.hero__slide');
            this.prevBtn = container.querySelector('.hero__slider-control--prev');
            this.nextBtn = container.querySelector('.hero__slider-control--next');
            this.pauseBtn = container.querySelector('.hero__slider-pause');
            
            this.currentSlide = 0;
            this.isPaused = false;
            this.autoplayInterval = null;
            this.autoplayDelay = 5000;

            this.init();
        }

        init() {
            if (!this.track || this.slides.length === 0) return;

            this.setupEventListeners();
            if (!prefersReducedMotion()) {
                this.startAutoplay();
            }
            this.updateAriaLabels();
        }

        setupEventListeners() {
            // Navigation buttons
            this.prevBtn?.addEventListener('click', () => this.goToPrevSlide());
            this.nextBtn?.addEventListener('click', () => this.goToNextSlide());
            this.pauseBtn?.addEventListener('click', () => this.toggleAutoplay());

            // Keyboard navigation
            this.container.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    this.goToPrevSlide();
                } else if (e.key === 'ArrowRight') {
                    this.goToNextSlide();
                } else if (e.key === ' ') {
                    e.preventDefault();
                    this.toggleAutoplay();
                }
            });

            // Pause on hover
            this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
            this.container.addEventListener('mouseleave', () => {
                if (!this.isPaused) this.startAutoplay();
            });

            // Touch support
            let touchStartX = 0;
            let touchEndX = 0;

            this.track.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            this.track.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(touchStartX, touchEndX);
            }, { passive: true });
        }

        handleSwipe(startX, endX) {
            const diff = startX - endX;
            const threshold = 50;

            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    this.goToNextSlide();
                } else {
                    this.goToPrevSlide();
                }
            }
        }

        goToNextSlide() {
            this.currentSlide = (this.currentSlide + 1) % this.slides.length;
            this.updateSlider();
        }

        goToPrevSlide() {
            this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
            this.updateSlider();
        }

        updateSlider() {
            this.slides.forEach((slide, index) => {
                slide.classList.toggle('hero__slide--active', index === this.currentSlide);
            });
            this.updateAriaLabels();
        }

        updateAriaLabels() {
            this.container.setAttribute('aria-live', this.isPaused ? 'polite' : 'off');
            if (this.pauseBtn) {
                this.pauseBtn.setAttribute('aria-label', 
                    this.isPaused ? 'Play slideshow' : 'Pause slideshow'
                );
                this.pauseBtn.querySelector('span').textContent = this.isPaused ? '▶' : '⏸';
            }
        }

        startAutoplay() {
            if (prefersReducedMotion()) return;
            this.stopAutoplay();
            this.autoplayInterval = setInterval(() => {
                this.goToNextSlide();
            }, this.autoplayDelay);
        }

        stopAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
                this.autoplayInterval = null;
            }
        }

        pauseAutoplay() {
            this.stopAutoplay();
        }

        toggleAutoplay() {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                this.stopAutoplay();
            } else {
                this.startAutoplay();
            }
            this.updateAriaLabels();
        }
    }

    // Choose School Slider
    // ==========================================================================

    class ChooseSchoolSlider {
        constructor(container) {
            this.container = container;
            this.track = container.querySelector('.choose-school__track');
            this.cards = container.querySelectorAll('.choose-school__card');
            this.prevBtn = container.querySelector('.choose-school__nav--prev');
            this.nextBtn = container.querySelector('.choose-school__nav--next');
            this.dots = container.querySelectorAll('.choose-school__dot');
            
            this.currentIndex = 0;
            this.cardsPerView = this.getCardsPerView();
            this.maxIndex = Math.max(0, this.cards.length - this.cardsPerView);

            this.init();
        }

        init() {
            if (!this.track || this.cards.length === 0) return;

            this.setupEventListeners();
            this.updateSlider();
            this.handleResize();
        }

        getCardsPerView() {
            const width = window.innerWidth;
            if (width < 480) return 1;
            if (width < 768) return 1;
            if (width < 1024) return 2;
            return 4;
        }

        setupEventListeners() {
            this.prevBtn?.addEventListener('click', () => this.goToPrev());
            this.nextBtn?.addEventListener('click', () => this.goToNext());

            this.dots.forEach((dot, index) => {
                dot.addEventListener('click', () => this.goToIndex(index));
            });

            // Touch support
            let touchStartX = 0;
            let touchEndX = 0;

            this.track.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            this.track.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(touchStartX, touchEndX);
            }, { passive: true });

            // Keyboard navigation
            this.container.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    this.goToPrev();
                } else if (e.key === 'ArrowRight') {
                    this.goToNext();
                }
            });
        }

        handleResize() {
            window.addEventListener('resize', debounce(() => {
                this.cardsPerView = this.getCardsPerView();
                this.maxIndex = Math.max(0, this.cards.length - this.cardsPerView);
                this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
                this.updateSlider();
            }, 250));
        }

        handleSwipe(startX, endX) {
            const diff = startX - endX;
            const threshold = 50;

            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    this.goToNext();
                } else {
                    this.goToPrev();
                }
            }
        }

        goToNext() {
            if (this.currentIndex < this.maxIndex) {
                this.currentIndex++;
                this.updateSlider();
            }
        }

        goToPrev() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateSlider();
            }
        }

        goToIndex(index) {
            this.currentIndex = Math.min(index, this.maxIndex);
            this.updateSlider();
        }

        updateSlider() {
            const cardWidth = this.cards[0]?.offsetWidth || 0;
            const gap = 24; // --spacing-lg
            const offset = -(this.currentIndex * (cardWidth + gap));
            
            if (!prefersReducedMotion()) {
                this.track.style.transform = `translateX(${offset}px)`;
            } else {
                this.track.style.transform = `translateX(${offset}px)`;
                this.track.style.transition = 'none';
            }

            // Update dots
            this.dots.forEach((dot, index) => {
                const isActive = index === this.currentIndex;
                dot.classList.toggle('choose-school__dot--active', isActive);
                dot.setAttribute('aria-selected', isActive);
            });

            // Update button states
            if (this.prevBtn) {
                this.prevBtn.disabled = this.currentIndex === 0;
                this.prevBtn.setAttribute('aria-disabled', this.currentIndex === 0);
            }
            if (this.nextBtn) {
                this.nextBtn.disabled = this.currentIndex === this.maxIndex;
                this.nextBtn.setAttribute('aria-disabled', this.currentIndex === this.maxIndex);
            }
        }
    }

// School Logos Slider (gesture enabled)
    // ========================================================================== 

    class SchoolLogosSlider {
        constructor(containers) {
            // Accept NodeList or selector
            this.containers = (typeof containers === 'string') ? document.querySelectorAll(containers) : containers;
            this.init();
        }

        init() {
            if (!this.containers || this.containers.length === 0) return;

            this.containers.forEach(container => this.setupContainer(container));
        }

        setupContainer(container) {
            const track = container.querySelector('.participating-schools__track');
            if (!track) return;

            // Make container scrollable horizontally and enable smooth interaction
            container.style.overflowX = 'auto';
            container.style.scrollBehavior = 'smooth';
            container.classList.add('logos-scrollable');
            container.tabIndex = 0;

            // Pointer dragging
            let isDown = false;
            let startX = 0;
            let scrollLeft = 0;

            const pointerDown = (e) => {
                isDown = true;
                container.classList.add('is-dragging');
                startX = e.pageX ?? (e.touches && e.touches[0].pageX);
                scrollLeft = container.scrollLeft;
                // pause CSS animation if any
                track.style.animationPlayState = 'paused';
                e.preventDefault();
            };

            const pointerMove = (e) => {
                if (!isDown) return;
                const x = e.pageX ?? (e.touches && e.touches[0].pageX);
                const walk = startX - x;
                container.scrollLeft = scrollLeft + walk;
            };

            const pointerUp = () => {
                isDown = false;
                container.classList.remove('is-dragging');
                track.style.animationPlayState = 'running';
            };

            container.addEventListener('mousedown', pointerDown);
            container.addEventListener('mousemove', pointerMove);
            container.addEventListener('mouseup', pointerUp);
            container.addEventListener('mouseleave', pointerUp);

            container.addEventListener('touchstart', pointerDown, { passive: false });
            container.addEventListener('touchmove', pointerMove, { passive: false });
            container.addEventListener('touchend', pointerUp);

            // Wheel -> horizontal scroll
            container.addEventListener('wheel', (e) => {
                // Prefer horizontal scroll when available, else map vertical to horizontal
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                container.scrollLeft += delta;
                e.preventDefault();
            }, { passive: false });

            // Keyboard navigation
            container.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') container.scrollLeft -= 200;
                if (e.key === 'ArrowRight') container.scrollLeft += 200;
            });

            // Pause CSS animation on hover/touch
            container.addEventListener('mouseenter', () => { track.style.animationPlayState = 'paused'; });
            container.addEventListener('mouseleave', () => { track.style.animationPlayState = 'running'; });
            container.addEventListener('touchstart', () => { track.style.animationPlayState = 'paused'; }, { passive: true });
            container.addEventListener('touchend', () => { track.style.animationPlayState = 'running'; });
        }
    }

    // Exhibition Benefits Slider (improved: pointer drag, wheel and lazy activation)
    // ========================================================================== 

    class ExhibitionBenefitsSlider {
        constructor(container, autoInit = true) {
            this.container = container;
            this.track = container.querySelector('.exhibition-benefits__track');
            this.cards = container.querySelectorAll('.exhibition-benefits__card');
            this.prevBtn = container.querySelector('.exhibition-benefits__nav--prev');
            this.nextBtn = container.querySelector('.exhibition-benefits__nav--next');

            this.currentIndex = 0;
            this.cardsPerView = this.getCardsPerView();
            this.maxIndex = Math.max(0, this.cards.length - this.cardsPerView);

            this._activated = false;

            if (autoInit) this.init();
        }

        init() {
            if (this._activated) return;
            if (!this.track || this.cards.length === 0) return;

            this._activated = true;
            this.setupEventListeners();
            this.updateSlider();
            this.handleResize();
        }

        getCardsPerView() {
            const width = window.innerWidth;
            if (width < 480) return 1;
            if (width < 768) return 1;
            if (width < 1024) return 2;
            return 4;
        }

        setupEventListeners() {
            this.prevBtn?.addEventListener('click', () => this.goToPrev());
            this.nextBtn?.addEventListener('click', () => this.goToNext());

            // Touch support
            let touchStartX = 0;
            let touchEndX = 0;

            this.track.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            this.track.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(touchStartX, touchEndX);
            }, { passive: true });

            // Pointer (mouse) drag support
            let isDragging = false;
            let startX = 0;
            let prevTranslate = 0;
            let currentTranslate = 0;

            const onPointerDown = (e) => {
                isDragging = true;
                startX = e.pageX ?? (e.touches && e.touches[0].pageX);
                prevTranslate = currentTranslate;
                this.track.style.transition = 'none';
                this.track.setPointerCapture?.(e.pointerId);
                e.preventDefault();
            };

            const onPointerMove = (e) => {
                if (!isDragging) return;
                const x = e.pageX ?? (e.touches && e.touches[0].pageX);
                const movedBy = x - startX;
                currentTranslate = prevTranslate + movedBy;
                this.track.style.transform = `translateX(${currentTranslate}px)`;
            };

            const onPointerUp = (e) => {
                if (!isDragging) return;
                isDragging = false;
                this.track.style.transition = '';

                // Decide nearest index to snap
                const cardWidth = this.cards[0]?.offsetWidth || 0;
                const gap = 24;
                const slideWidth = cardWidth + gap;
                const index = Math.round(-currentTranslate / slideWidth);
                this.currentIndex = Math.max(0, Math.min(this.maxIndex, index));
                this.updateSlider();
            };

            // Attach pointer events
            this.track.addEventListener('mousedown', onPointerDown);
            window.addEventListener('mousemove', onPointerMove);
            window.addEventListener('mouseup', onPointerUp);
            this.track.addEventListener('touchstart', onPointerDown, { passive: false });
            this.track.addEventListener('touchmove', onPointerMove, { passive: false });
            this.track.addEventListener('touchend', onPointerUp);

            // Wheel navigation (map vertical scroll to horizontal slides)
            this.track.addEventListener('wheel', (e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    e.preventDefault();
                    if (e.deltaY > 5) {
                        this.goToNext();
                    } else if (e.deltaY < -5) {
                        this.goToPrev();
                    }
                }
            }, { passive: false });

            // Keyboard navigation
            this.container.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') this.goToPrev();
                if (e.key === 'ArrowRight') this.goToNext();
            });
        }

        handleResize() {
            window.addEventListener('resize', debounce(() => {
                this.cardsPerView = this.getCardsPerView();
                this.maxIndex = Math.max(0, this.cards.length - this.cardsPerView);
                this.currentIndex = Math.min(this.currentIndex, this.maxIndex);
                this.updateSlider();
            }, 250));
        }

        handleSwipe(startX, endX) {
            const diff = startX - endX;
            const threshold = 50;

            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    this.goToNext();
                } else {
                    this.goToPrev();
                }
            }
        }

        goToNext() {
            if (this.currentIndex < this.maxIndex) {
                this.currentIndex++;
                this.updateSlider();
            }
        }

        goToPrev() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.updateSlider();
            }
        }

        updateSlider() {
            const cardWidth = this.cards[0]?.offsetWidth || 0;
            const gap = 24; // --spacing-lg
            const offset = -(this.currentIndex * (cardWidth + gap));
            
            if (!prefersReducedMotion()) {
                this.track.style.transform = `translateX(${offset}px)`;
            } else {
                this.track.style.transform = `translateX(${offset}px)`;
                this.track.style.transition = 'none';
            }

            // Update button states
            if (this.prevBtn) {
                this.prevBtn.disabled = this.currentIndex === 0;
                this.prevBtn.setAttribute('aria-disabled', this.currentIndex === 0);
            }
            if (this.nextBtn) {
                this.nextBtn.disabled = this.currentIndex === this.maxIndex;
                this.nextBtn.setAttribute('aria-disabled', this.currentIndex === this.maxIndex);
            }
        }
    }

    // Form Validation
    // ==========================================================================

    class FormValidator {
        constructor(form) {
            this.form = form;
            this.init();
        }

        init() {
            if (!this.form) return;

            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateForm()) {
                    this.handleSubmit();
                }
            });

            // Real-time validation
            const inputs = this.form.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearError(input));
            });
        }

        validateField(field) {
            const value = field.value.trim();
            const type = field.type;
            let isValid = true;
            let errorMessage = '';

            if (field.hasAttribute('required') && !value) {
                isValid = false;
                errorMessage = 'This field is required';
            } else if (type === 'tel' && value) {
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid 10-digit phone number';
                }
            }

            if (!isValid) {
                this.showError(field, errorMessage);
            } else {
                this.clearError(field);
            }

            return isValid;
        }

        validateForm() {
            const inputs = this.form.querySelectorAll('input[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!this.validateField(input)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        showError(field, message) {
            this.clearError(field);
            
            field.setAttribute('aria-invalid', 'true');
            field.classList.add('enquiry-form__input--error');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'enquiry-form__error';
            errorDiv.id = `${field.id}-error`;
            errorDiv.textContent = message;
            errorDiv.setAttribute('role', 'alert');
            
            field.setAttribute('aria-describedby', errorDiv.id);
            field.parentNode.appendChild(errorDiv);
        }

        clearError(field) {
            field.removeAttribute('aria-invalid');
            field.removeAttribute('aria-describedby');
            field.classList.remove('enquiry-form__input--error');
            
            const existingError = field.parentNode.querySelector('.enquiry-form__error');
            if (existingError) {
                existingError.remove();
            }
        }

        handleSubmit() {
            // Get form data
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());

            // In a real implementation, this would send data to a server
            console.log('Form submitted:', data);

            // Show success message
            this.showSuccessMessage();
            this.form.reset();
        }

        showSuccessMessage() {
            const successDiv = document.createElement('div');
            successDiv.className = 'enquiry-form__success';
            successDiv.textContent = 'Thank you! We will contact you soon.';
            successDiv.setAttribute('role', 'alert');
            
            this.form.appendChild(successDiv);

            setTimeout(() => {
                successDiv.remove();
            }, 5000);
        }
    }

    // Smooth Scroll
    // ==========================================================================

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || !href) return;

                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
                    });
                }
            });
        });
    }

    // Intersection Observer for Animations
    // ==========================================================================

    function initScrollAnimations() {
        if (prefersReducedMotion()) return;

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');

                    // When exhibition benefits animates in, activate the slider if it was created lazily
                    if (entry.target.classList.contains('exhibition-benefits') && window.__benefitsSlider) {
                        window.__benefitsSlider.init();
                    }

                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe sections
        document.querySelectorAll('.stats, .participating-schools, .choose-school, .appointments, .exhibition-benefits').forEach(section => {
            observer.observe(section);
        });
    }

    // Add error styling to CSS dynamically
    // ==========================================================================

    function addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .enquiry-form__input--error {
                border: 2px solid #d32f2f !important;
            }
            
            .enquiry-form__error {
                color: #d32f2f;
                font-size: 14px;
                margin-top: 4px;
            }
            
            .enquiry-form__success {
                background: #4caf50;
                color: white;
                padding: 16px;
                border-radius: 8px;
                margin-top: 16px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize Everything
    // ==========================================================================

    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Prevent iOS zoom on double tap
        if (isTouchDevice()) {
            document.addEventListener('touchmove', function(e) {
                if (e.scale !== 1) {
                    e.preventDefault();
                }
            }, { passive: false });
        }

        // Add dynamic styles
        addDynamicStyles();

        // Disable default iOS pulldown-to-refresh gesture (only on app-like experience)
        if (isTouchDevice()) {
            document.body.addEventListener('touchmove', function(e) {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            }, { passive: false });
        }

        // Initialize hero slider
        const heroSlider = document.querySelector('.hero__slider');
        if (heroSlider) {
            new HeroSlider(heroSlider);
        }

        // Initialize choose school slider
        const chooseSchoolContainer = document.querySelector('.choose-school__container');
        if (chooseSchoolContainer) {
            new ChooseSchoolSlider(chooseSchoolContainer);
        }

        // Initialize exhibition benefits slider (lazy init - activate when section animates in)
        const benefitsContainer = document.querySelector('.exhibition-benefits__container');
        if (benefitsContainer) {
            // create object but don't init until visible
            window.__benefitsSlider = new ExhibitionBenefitsSlider(benefitsContainer, false);
        }

        // Initialize school logos slider (gesture enabled)
        const schoolLogoContainers = document.querySelectorAll('.participating-schools__slider');
        if (schoolLogoContainers && schoolLogoContainers.length) {
            new SchoolLogosSlider(schoolLogoContainers);
        }

        // Initialize form validation
        const enquiryForm = document.querySelector('.enquiry-form');
        if (enquiryForm) {
            new FormValidator(enquiryForm);
        }

        // Initialize animated buttons (submit and appointments CTA)
        document.querySelectorAll('.animated-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                btn.classList.toggle('active');
            });
        });

        // Initialize smooth scroll
        initSmoothScroll();

        // Initialize scroll animations
        initScrollAnimations();

        // Header at-top state handling: keep the header in the 'light' (attached-image) style
        (function() {
            const headerEl = document.querySelector('.header');
            if (!headerEl) return;

            let wasAtTop = window.scrollY === 0;
            const ANIM_TIMEOUT = 700; // ms

            const updateHeaderAtTop = () => {
                const atTop = window.scrollY === 0;
                headerEl.classList.toggle('header--at-top', atTop);

                // Play entrance animation when we arrive at the top (only when reduced motion not preferred)
                if (!prefersReducedMotion() && atTop && !wasAtTop) {
                    headerEl.classList.add('is-animated');
                    clearTimeout(headerEl._headerAnimTimer);
                    headerEl._headerAnimTimer = setTimeout(() => headerEl.classList.remove('is-animated'), ANIM_TIMEOUT);
                }

                wasAtTop = atTop;
            };

            // initial state
            updateHeaderAtTop();

            // If the page loaded at top, play the entrance animation once for a nicer effect
            if (!prefersReducedMotion() && wasAtTop) {
                requestAnimationFrame(() => {
                    headerEl.classList.add('is-animated');
                    clearTimeout(headerEl._headerAnimTimer);
                    headerEl._headerAnimTimer = setTimeout(() => headerEl.classList.remove('is-animated'), ANIM_TIMEOUT);
                });
            }

            // update on scroll (debounced) and when the page is shown (back/forward navigation)
            window.addEventListener('scroll', debounce(updateHeaderAtTop, 50));
            window.addEventListener('pageshow', updateHeaderAtTop);
        })();

        // Handle window resize for responsive behavior
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Trigger custom resize event for sliders
                window.dispatchEvent(new Event('sliderResize'));
            }, 250);
        });

        // Prevent pinch zoom on mobile while allowing accessibility
        document.addEventListener('wheel', function(e) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // Start initialization
    init();

})();
