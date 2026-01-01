<?php

declare(strict_types=1);

namespace App\Models;

use App\Observers\ProductObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @param int $category_id
 * @param string $image
 * @param string $name
 * @param string $slug
 * @param string $description
 */
#[ObservedBy(ProductObserver::class)]
class Product extends Model
{
    /** @use HasFactory<\Database\Factories\ProductFactory> */
    use HasFactory;

    protected $fillable = [
        "category_id",
        "image",
        "name",
        "slug",
        "description",
        "price",
        "discount_percent",
        "cashback_percent",
        "promo_label",
        "promo_expires_at",
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'description' => 'array',
        'discount_percent' => 'decimal:2',
        'cashback_percent' => 'decimal:2',
        'promo_expires_at' => 'datetime',
    ];

    /**
     * @return HasMany<ProductImage, Product>
     */
    public function images(): HasMany 
    {
        return $this->hasMany(ProductImage::class);
    }

    /**
     * @return HasMany<ProductReview, Product>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    /**
     * Summary of category
     * @return BelongsTo<Category, Product>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }


        

}
