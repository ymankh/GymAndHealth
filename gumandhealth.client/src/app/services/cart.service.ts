import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Cart, CartItem } from '../shared/interfaces'; // Assuming you have a CartItem interface
import iziToast from 'izitoast';
import { AuthService } from './auth.service';
import { root } from '../shared/constants';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>(this.cartItems);

  cart$ = this.cartSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient,
    readonly authService: AuthService
  ) {
    // Load cart from localStorage if available
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      this.cartItems = JSON.parse(storedCart);
      this.cartSubject.next(this.cartItems);
    }
  }

  checkout() {
    if (!this.authService.isUserLoggedIn()) {
      iziToast.warning({
        title: 'Cannot checkout',
        message: 'Please login to checkout',
        position: 'topCenter',
        timeout: 3000,
      });
      return;
    }
    this.http
      .get<{ approvalUrl: string }>(`${root}/api/Cart/Checkout`, {
        headers: this.authService.headers(),
      })
      .subscribe((response) => this.openPaymentPopup(response.approvalUrl));
  }
  // Fetch cart items from API (for online sync)
  loadCartFromServer() {
    if (!this.authService.isUserLoggedIn()) return;
    this.http
      .get<Cart>(`${root}/api/Cart}`, {
        headers: this.authService.headers(),
      })
      .subscribe((cart) => {
        this.cartItems = cart.cartItems!;
        this.cartSubject.next(this.cartItems);
        this.saveCartToLocalStorage();
        // Get cart items from local storage and send them to the server.
        for (const item of this.cartItems) {
          this.addToCart(item);
        }
      });
  }

  // Add item to cart
  addToCart(item: CartItem): void {
    const existingItem = this.cartItems.find(
      (cartItem) => cartItem.productId === item.productId
    );
    if (existingItem) {
      existingItem.quantity! += item.quantity!;
    } else {
      this.cartItems.push(item);
    }
    this.cartSubject.next(this.cartItems);
    this.saveCartToLocalStorage();
    iziToast.success({
      title: 'item added',
      message: 'Successfully inserted to the cart',
    });
    this.updateOnlineCart(item);
  }

  updateQuantity(item: CartItem) {
    this.cartItems.forEach((cartItem) => {
      if (cartItem.productId === item.productId) {
        cartItem.quantity = item.quantity;
      }
    });
    this.cartSubject.next(this.cartItems);
    this.saveCartToLocalStorage();
    this.updateOnlineCart(item);
  }

  // Remove item from cart
  removeFromCart(productId: number): void {
    this.cartItems = this.cartItems.filter(
      (item) => item.productId !== productId
    );

    this.cartSubject.next(this.cartItems);
    this.saveCartToLocalStorage();
    this.deleteFromCart(productId);
  }

  // Clear the cart
  clearCart(): void {
    this.cartItems = [];
    this.cartSubject.next(this.cartItems);
    localStorage.removeItem('cart');
    this.clearOnlineCart();
  }

  // Save cart items to local storage for offline use
  private saveCartToLocalStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
  }

  // Get total price of items in the cart (adjust this if you want to include product details)
  getTotalPrice(): number {
    return this.cartItems.reduce(
      (total, item) =>
        total + (item.product?.price ?? 0) * (item.quantity ?? 1),
      0
    );
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity!, 0);
  }

  private updateOnlineCart(item: CartItem) {
    if (!this.authService.isUserLoggedIn()) return;
    this.http
      .post<CartItem>(
        `${root}/api/Cart/AddToCart`,
        {
          productId: item.productId,
          quantity: item.quantity,
        },
        {
          headers: this.authService.headers(),
        }
      )
      .subscribe(
        (item) => console.log(item),
        (error) => console.log(error)
      );
  }
  private deleteFromCart(productId: number) {
    if (!this.authService.isUserLoggedIn()) return;
    this.http
      .delete<void>(`${root}/api/Cart/DeleteCartItem/${productId}`, {
        headers: this.authService.headers(),
      })
      .subscribe(
        () => console.log('Item with productId ' + productId + ' deleted'),
        (error) => console.log(error)
      );
  }
  private clearOnlineCart() {
    if (!this.authService.isUserLoggedIn()) return;
    this.http
      .delete<void>(`${root}/api/Cart/ClearCart`, {
        headers: this.authService.headers(),
      })
      .subscribe(
        () => console.log('Cart cleared'),
        (error) => console.log(error)
      );
  }
  private openPaymentPopup(url: string): void {
    // Open the payment link in a new popup window
    const popup = window.open(url, '_blank', 'width=800,height=600');

    // Check if the popup is closed
    const popupChecker = setInterval(() => {
      if (popup?.closed) {
        clearInterval(popupChecker); // Stop checking once the window is closed
        this.onPopupClose(); // Perform the action after window is closed
      }
    }, 500); // Check every 500 milliseconds
  }
  private onPopupClose(): void {
    iziToast.success({
      title: 'Payment Successful',
      message: 'Thank you for your purchase!',
      position: 'topCenter',
      timeout: 3000,
    });
    this.clearCart();
    this.router.navigate(['']);
  }
}
