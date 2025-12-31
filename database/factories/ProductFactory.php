<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $price = $this->faker->randomFloat(2, 10, 300);
        $discountPercent = $this->faker->randomElement([0, 0, 5, 10, 15, 20]);
        $cashbackPercent = $this->faker->randomElement([0, 2, 5]);

        return [
            'category_id' => Category::inRandomOrder()->first()->id,
            'name' => fake()->words(3, true),
            'description' => fake()->paragraph(),
            'price' => $price,
            'discount_percent' => $discountPercent,
            'cashback_percent' => $cashbackPercent,
            'promo_label' => $discountPercent > 0 ? fake()->randomElement(['Spring Sale', 'Launch Deal', 'Limited Promo']) : null,
            'promo_expires_at' => $discountPercent > 0 ? fake()->dateTimeBetween('now', '+30 days') : null,
        ];
    }
}
