<?php

use App\Http\Controllers\CheckoutRedirectController;
use App\Http\Controllers\StripeWebhookController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('purchase-history', function () {
        return Inertia::render('purchase-history');
    })->name('purchase-history');

    Route::get('favorites', function () {
        return Inertia::render('favorites');
    })->name('favorites');

    Route::get('support', function () {
        return Inertia::render('support');
    })->name('support');

    Route::get('wallet', function () {
        return Inertia::render('wallet');
    })->name('wallet');
});

Route::get('checkout/success', [CheckoutRedirectController::class, 'success'])->name('checkout.success');
Route::get('checkout/cancel', [CheckoutRedirectController::class, 'cancel'])->name('checkout.cancel');
Route::post('stripe/webhook', StripeWebhookController::class)->name('stripe.webhook');

Route::get('/checkout', function (Request $request) {
    $stripePriceId = 'price_deluxe_album';
 
    $quantity = 1;
 
    return $request->user()->checkout([$stripePriceId => $quantity], [
        'success_url' => route('checkout-success'),
        'cancel_url' => route('checkout-cancel'),
    ]);
})->name('checkout');

Route::view('/checkout/success', 'checkout.success')->name('checkout.success');
Route::view('/checkout/cancel', 'checkout.cancel')->name('checkout.cancel');

require __DIR__.'/settings.php';
