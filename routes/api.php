<?php

use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\ProductReviewController;
use App\Http\Controllers\Api\PurchaseHistoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('products', ProductController::class)
    ->only(['index', 'show']);
Route::apiResource('products', ProductController::class)
    ->only(['store', 'update', 'destroy'])
    ->middleware('auth:sanctum');

Route::post('checkout', [CheckoutController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:30,1']);

Route::get('purchases', [PurchaseHistoryController::class, 'index'])
    ->middleware(['auth:sanctum', 'throttle:60,1']);
Route::get('purchases/export/csv', [PurchaseHistoryController::class, 'exportCsv'])
    ->middleware(['auth:sanctum', 'throttle:10,1']);
Route::get('purchases/export/print', [PurchaseHistoryController::class, 'exportPrint'])
    ->middleware(['auth:sanctum', 'throttle:10,1']);

Route::get('favorites', [FavoriteController::class, 'index'])
    ->middleware(['auth:sanctum', 'throttle:60,1']);
Route::post('favorites', [FavoriteController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:60,1']);
Route::delete('favorites/{product}', [FavoriteController::class, 'destroy'])
    ->middleware(['auth:sanctum', 'throttle:60,1']);

Route::get('support-tickets', [SupportTicketController::class, 'index'])
    ->middleware(['auth:sanctum', 'throttle:60,1']);
Route::post('support-tickets', [SupportTicketController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:30,1']);

Route::get('products/{product}/reviews', [ProductReviewController::class, 'index']);
Route::post('products/{product}/reviews', [ProductReviewController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:30,1']);

Route::get('cart', [CartController::class, 'show'])
    ->middleware(['auth:sanctum', 'throttle:60,1']);
Route::post('cart', [CartController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:60,1']);
Route::delete('cart', [CartController::class, 'destroy'])
    ->middleware(['auth:sanctum', 'throttle:30,1']);

Route::get('wallet', [WalletController::class, 'show'])
    ->middleware(['auth:sanctum', 'throttle:60,1']);
