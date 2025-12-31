<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                "name" => "Monitors",
                "description" => "Desktop displays for work, gaming, and creative setups.",
            ],
            [
                "name" => "Laptops",
                "description" => "Portable computers for everyday use, creators, and power users.",
            ],
            [
                "name" => "Keyboards",
                "description" => "Mechanical and wireless keyboards for productivity and gaming.",
            ],
            [
                "name" => "Mice",
                "description" => "Ergonomic and precision mice for office and competitive play.",
            ],
            [
                "name" => "Headphones",
                "description" => "Over-ear, on-ear, and in-ear audio for music and meetings.",
            ],
            [
                "name" => "Storage",
                "description" => "SSDs, HDDs, and external drives to expand capacity.",
            ],
            [
                "name" => "Networking",
                "description" => "Routers, switches, and mesh Wi-Fi for reliable connections.",
            ],
            [
                "name" => "Accessories",
                "description" => "Cables, adapters, stands, and other daily essentials.",
            ]
        ];

        foreach ($categories as $category) {
            $slug = Str::slug($category["name"]);

            Category::query()->updateOrCreate(
                ["slug" => $slug],
                [
                    "name" => $category["name"],
                    "description" => $category["description"],
                ]
            );
        }
    }
}
