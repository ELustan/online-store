<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favorite extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
    ];

    /**
     * @return BelongsTo<User, Favorite>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Product, Favorite>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
